use std::sync::Arc;

use aide::axum::routing::{delete_with, get_with, patch_with, post_with};
use axum::{extract::Path, Json};
use chrono::Utc;
use schemars::JsonSchema;
use tokio::sync::RwLock;
use uuid::Uuid;

use crate::{
    db::db,
    entities::{Ban, Handle, Invite, MemberExt, MemberKey, Space, SpaceExt, SpacePatch, SpaceUser},
    error::Error,
    functions::{
        handle_verification::{
            create_attestation, generate_challenge, verify_handle, VerificationChallenge,
            VerificationResult, VerifyHandleRequest,
        },
        jwt::Claims,
        permissions::{permissions_or_admin, Permission},
        pubsub::emit_event,
    },
    middlewares::load::Load,
};

use super::{
    router::AppRouter,
    ws::{state::State, SocketAction},
};

pub mod bans;
pub mod invites;
pub mod members;
pub mod roles;

#[derive(Deserialize, JsonSchema)]
#[serde(rename_all = "camelCase")]
pub struct SpaceCreatePayload {
    pub name: String,
}

#[derive(Deserialize, JsonSchema)]
#[serde(rename_all = "camelCase")]
pub struct SpaceUpdatePayload {
    pub name: Option<String>,
    pub icon: Option<String>,
    pub handle: Option<String>,
}

impl SpaceUpdatePayload {
    fn to_patch(&self) -> SpacePatch {
        SpacePatch {
            name: self.name.clone(),
            icon: self.icon.clone(),
            ..Default::default()
        }
    }
}

async fn join_space(space: &SpaceExt, user_id: Uuid) -> Result<(), Error> {
    if Ban::find_by_space_and_user(space.base.id, user_id, db())
        .await?
        .is_some()
    {
        return Err(Error::forbidden("You are banned from this space"));
    }
    let member = SpaceUser::new(space.base.id, user_id);
    member.create(db()).await?;
    let member = MemberExt::dataload_one(member, db()).await?;

    emit_event(
        "members.onCreate",
        member,
        &format!("space:{}", space.base.id),
    )
    .await?;
    emit_event("spaces.onCreate", space, &format!("user:{user_id}")).await?;
    Ok(())
}

async fn leave_space(space: &SpaceExt, member: &MemberExt) -> Result<(), Error> {
    let key = member.key();
    SpaceUser::delete_by_key(&key, db()).await?;
    emit_event(
        "members.onDelete",
        &member,
        &format!("space:{}", space.base.id),
    )
    .await?;
    emit_event(
        "spaces.onDelete",
        &space,
        &format!("user:{}", member.base.user_id),
    )
    .await?;
    Ok(())
}

async fn get(
    _claim: Claims,
    _member: Load<MemberExt>,
    Load(space): Load<SpaceExt>,
) -> Result<Json<SpaceExt>, Error> {
    Ok(space.into())
}

async fn list(claims: Claims) -> Result<Json<Vec<SpaceExt>>, Error> {
    let spaces = Space::list_from_user_id(claims.sub.parse()?, db()).await?;
    let spaces = SpaceExt::dataload(spaces, db()).await?;
    Ok(spaces.into())
}

async fn create(
    claims: Claims,
    Json(body): Json<SpaceCreatePayload>,
) -> Result<Json<SpaceExt>, Error> {
    let space = Space::new(body.name, claims.sub.parse()?);
    space.create(db()).await?;
    let space = SpaceExt::dataload_one(space, db()).await?;
    join_space(&space, claims.sub.parse()?).await?;
    Ok(space.into())
}

async fn update(
    Path(space_id): Path<Uuid>,
    Load(space): Load<SpaceExt>,
    Load(member): Load<MemberExt>,
    Json(body): Json<SpaceUpdatePayload>,
) -> Result<Json<SpaceExt>, Error> {
    permissions_or_admin(&space, &member, Permission::MANAGE_SPACE)?;

    // Update handle if provided
    if let Some(ref new_handle) = body.handle {
        if new_handle.is_empty() {
            // Empty string means release the handle
            Handle::release_for_space(space_id, db()).await?;
        } else {
            // Determine the full handle
            let full_handle = if !new_handle.contains('.') {
                // Plain name -> create default handle (e.g., "rust-lang" -> "rust-lang.mikoto.io")
                Handle::validate_username(new_handle)?;
                Handle::make_default_handle(new_handle)
            } else if Handle::is_default_handle(new_handle) {
                // Already a default handle, validate and use as-is
                Handle::validate(new_handle)?;
                new_handle.clone()
            } else {
                // Looks like a custom domain - must go through verification
                return Err(Error::new(
                    "CustomDomainRequiresVerification",
                    axum::http::StatusCode::BAD_REQUEST,
                    "Custom domain handles require verification. Use the /:spaceId/handle/verify endpoint to verify your domain.",
                ));
            };

            Handle::change_space_handle(space_id, full_handle, db()).await?;
        }
    }

    let space = Space::find_by_id(space_id, db()).await?;
    let space = space.update(body.to_patch(), db()).await?;
    let space = SpaceExt::dataload_one(space, db()).await?;
    emit_event(
        "spaces.onUpdate",
        &space,
        &format!("space:{}", space.base.id),
    )
    .await?;
    Ok(space.into())
}

async fn delete(Load(space): Load<SpaceExt>, claims: Claims) -> Result<Json<()>, Error> {
    if space.base.owner_id == Some(claims.sub.parse()?) {
        space.base.delete(db()).await?;
        emit_event("spaces.onDelete", &space, &format!("user:{}", claims.sub)).await?;
    } else {
        return Err(Error::unauthorized("Only the owner may delete the space"));
    }
    Ok(().into())
}

async fn invite_preview(Path(invite): Path<String>) -> Result<Json<SpaceExt>, Error> {
    let invite = Invite::find_by_id(&invite, db()).await?;

    let space = Space::find_by_id(invite.space_id, db()).await?;
    let space = SpaceExt::dataload_one(space, db()).await?;
    Ok(space.into())
}

async fn join(Path(invite): Path<String>, claims: Claims) -> Result<Json<SpaceExt>, Error> {
    let invite = Invite::find_by_id(&invite, db()).await?;

    let space = Space::find_by_id(invite.space_id, db()).await?;
    let space = SpaceExt::dataload_one(space, db()).await?;
    join_space(&space, claims.sub.parse()?).await?;
    Ok(space.into())
}

async fn leave(Path(space_id): Path<Uuid>, claims: Claims) -> Result<Json<()>, Error> {
    let space = Space::find_by_id(space_id, db()).await?;
    let space = SpaceExt::dataload_one(space, db()).await?;

    let member =
        SpaceUser::get_by_key(&MemberKey::new(space_id, claims.sub.parse()?), db()).await?;
    let member = MemberExt::dataload_one(member, db()).await?;

    leave_space(&space, &member).await?;
    Ok(().into())
}

/// Start the custom domain verification process for a space
async fn start_handle_verification(
    Path(space_id): Path<Uuid>,
    Load(space): Load<SpaceExt>,
    Load(member): Load<MemberExt>,
    Json(body): Json<VerifyHandleRequest>,
) -> Result<Json<VerificationChallenge>, Error> {
    permissions_or_admin(&space, &member, Permission::MANAGE_SPACE)?;

    // Validate this is a custom domain (not a default handle)
    Handle::validate_custom_domain(&body.handle)?;

    // Generate a challenge
    let challenge = generate_challenge(&body.handle, "space", space_id)?;

    Ok(challenge.into())
}

/// Complete the custom domain verification for a space
async fn complete_handle_verification(
    Path(space_id): Path<Uuid>,
    Load(space): Load<SpaceExt>,
    Load(member): Load<MemberExt>,
    Json(body): Json<VerifyHandleRequest>,
) -> Result<Json<VerificationResult>, Error> {
    permissions_or_admin(&space, &member, Permission::MANAGE_SPACE)?;

    // Validate this is a custom domain
    Handle::validate_custom_domain(&body.handle)?;

    // Verify the domain
    let result = verify_handle(&body.handle, "space", space_id).await?;

    if result.success {
        // Create attestation and update the handle
        let attestation = create_attestation(&body.handle, "space", space_id, None)?;
        let attestation_json = serde_json::to_value(&attestation)?;

        // Atomically replace the handle with the verified custom domain
        sqlx::query(
            r#"
            WITH deleted AS (
                DELETE FROM "Handle" WHERE "spaceId" = $1
            )
            INSERT INTO "Handle" (handle, "spaceId", "verifiedAt", attestation)
            VALUES ($2, $1, $3, $4)
            "#,
        )
        .bind(space_id)
        .bind(&body.handle)
        .bind(Utc::now().naive_utc())
        .bind(&attestation_json)
        .execute(db())
        .await
        .map_err(|e| match e {
            sqlx::Error::Database(ref db_err) if db_err.is_unique_violation() => Error::new(
                "HandleTaken",
                axum::http::StatusCode::CONFLICT,
                "This handle is already taken",
            ),
            _ => Error::from(e),
        })?;

        let space = Space::find_by_id(space_id, db()).await?;
        let space = SpaceExt::dataload_one(space, db()).await?;
        emit_event(
            "spaces.onUpdate",
            &space,
            &format!("space:{}", space.base.id),
        )
        .await?;
    }

    Ok(result.into())
}

static TAG: &str = "Spaces";

pub fn router() -> AppRouter<State> {
    AppRouter::new()
        .route(
            "/",
            get_with(list, |o| {
                o.tag(TAG).id("spaces.list").summary("List Spaces")
            }),
        )
        .route(
            "/:spaceId",
            get_with(get, |o| o.tag(TAG).id("spaces.get").summary("Get Space")),
        )
        .route(
            "/join/:invite",
            get_with(invite_preview, |o| {
                o.tag(TAG)
                    .id("spaces.preview")
                    .summary("Preview Space Invite")
            }),
        )
        .route(
            "/join/:invite",
            post_with(join, |o| o.tag(TAG).id("spaces.join").summary("Join Space")),
        )
        .route(
            "/",
            post_with(create, |o| {
                o.tag(TAG).id("spaces.create").summary("Create Space")
            }),
        )
        .route(
            "/:spaceId",
            patch_with(update, |o| {
                o.tag(TAG).id("spaces.update").summary("Update Space")
            }),
        )
        .route(
            "/:spaceId",
            delete_with(delete, |o| {
                o.tag(TAG).id("spaces.delete").summary("Delete Space")
            }),
        )
        .route(
            "/:spaceId/leave",
            delete_with(leave, |o| {
                o.tag(TAG).id("spaces.leave").summary("Leave Space")
            }),
        )
        .route(
            "/:spaceId/handle/verify",
            post_with(start_handle_verification, |o| {
                o.tag(TAG)
                    .id("spaces.startHandleVerification")
                    .summary("Start Custom Domain Verification")
                    .description("Generates a verification challenge for a custom domain handle. Returns the DNS TXT record and well-known file content to add for verification.")
            }),
        )
        .route(
            "/:spaceId/handle/verify/complete",
            post_with(complete_handle_verification, |o| {
                o.tag(TAG)
                    .id("spaces.completeHandleVerification")
                    .summary("Complete Custom Domain Verification")
                    .description("Verifies the custom domain by checking DNS TXT records or well-known files. On success, updates the space's handle to the verified domain.")
            }),
        )
        .ws_event(
            "onCreate",
            |space: SpaceExt, state: Arc<RwLock<State>>| async move {
                let mut writer = state.write().await;
                writer.actions.push(SocketAction::Subscribe(vec![format!(
                    "space:{}",
                    space.base.id
                )]));
                Some(space)
            },
        )
        .ws_event("onUpdate", |space: SpaceExt, _| async move { Some(space) })
        .ws_event(
            "onDelete",
            |space: SpaceExt, state: Arc<RwLock<State>>| async move {
                let mut writer = state.write().await;
                writer.actions.push(SocketAction::Unsubscribe(vec![format!(
                    "space:{}",
                    space.base.id
                )]));
                Some(space)
            },
        )
}
