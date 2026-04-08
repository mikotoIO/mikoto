use aide::axum::routing::{get_with, patch_with, post_with};
use axum::Json;
use chrono::Utc;
use schemars::JsonSchema;

use crate::{
    db::db,
    entities::{Handle, ObjectWithId, User, UserExt, UserPatch},
    error::Error,
    functions::{
        handle_verification::{
            create_attestation, generate_challenge, verify_handle, VerificationChallenge,
            VerificationResult, VerifyHandleRequest,
        },
        jwt::Claims,
        pubsub::emit_event,
    },
};

use super::{router::AppRouter, ws::state::State};

pub mod relations;

async fn me(claim: Claims) -> Result<Json<UserExt>, Error> {
    let user = User::find_by_id(claim.sub.parse()?, db()).await?;
    let user_ext = UserExt::from_user(user, db()).await?;
    Ok(user_ext.into())
}

async fn update(claim: Claims, Json(patch): Json<UserPatch>) -> Result<Json<UserExt>, Error> {
    let user = User::find_by_id(claim.sub.parse()?, db()).await?;
    let user = user.update(patch, db()).await?;
    let user_ext = UserExt::from_user(user.clone(), db()).await?;
    emit_event("users.onUpdate", &user_ext, &format!("user:{}", claim.sub)).await?;
    Ok(user_ext.into())
}

#[derive(Deserialize, JsonSchema)]
#[serde(rename_all = "camelCase")]
pub struct HandlePayload {
    pub handle: String,
}

async fn set_handle(
    claim: Claims,
    Json(body): Json<HandlePayload>,
) -> Result<Json<UserExt>, Error> {
    let user_id = claim.sub.parse()?;

    // Determine the full handle
    let full_handle = if !body.handle.contains('.') {
        // Plain username -> create default handle (e.g., "hayley" -> "hayley.mikoto.io")
        Handle::validate_username(&body.handle)?;
        Handle::make_default_handle(&body.handle)
    } else if Handle::is_default_handle(&body.handle) {
        // Already a default handle, validate and use as-is
        Handle::validate(&body.handle)?;
        body.handle.clone()
    } else {
        // Looks like a custom domain - must go through verification
        return Err(Error::new(
            "CustomDomainRequiresVerification",
            axum::http::StatusCode::BAD_REQUEST,
            "Custom domain handles require verification. Use the /me/handle/verify endpoint to verify your domain.",
        ));
    };

    Handle::change_user_handle(user_id, full_handle, db()).await?;

    let user = User::find_by_id(user_id, db()).await?;
    let user_ext = UserExt::from_user(user, db()).await?;
    emit_event("users.onUpdate", &user_ext, &format!("user:{}", claim.sub)).await?;
    Ok(user_ext.into())
}

/// Start the custom domain verification process
async fn start_handle_verification(
    claim: Claims,
    Json(body): Json<VerifyHandleRequest>,
) -> Result<Json<VerificationChallenge>, Error> {
    let user_id = claim.sub.parse()?;

    // Validate this is a custom domain (not a default handle)
    Handle::validate_custom_domain(&body.handle)?;

    // Generate a challenge
    let challenge = generate_challenge(&body.handle, "user", user_id)?;

    Ok(challenge.into())
}

/// Complete the custom domain verification
async fn complete_handle_verification(
    claim: Claims,
    Json(body): Json<VerifyHandleRequest>,
) -> Result<Json<VerificationResult>, Error> {
    let user_id = claim.sub.parse()?;

    // Validate this is a custom domain
    Handle::validate_custom_domain(&body.handle)?;

    // Verify the domain
    let result = verify_handle(&body.handle, "user", user_id).await?;

    if result.success {
        // Create attestation and update the handle
        let attestation = create_attestation(&body.handle, "user", user_id, None)?;
        let attestation_json = serde_json::to_value(&attestation)?;

        // Atomically replace the handle with the verified custom domain
        sqlx::query(
            r#"
            WITH deleted AS (
                DELETE FROM "Handle" WHERE "userId" = $1
            )
            INSERT INTO "Handle" (handle, "userId", "verifiedAt", attestation)
            VALUES ($2, $1, $3, $4)
            "#,
        )
        .bind(user_id)
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

        let user = User::find_by_id(user_id, db()).await?;
        let user_ext = UserExt::from_user(user, db()).await?;
        emit_event("users.onUpdate", &user_ext, &format!("user:{}", claim.sub)).await?;
    }

    Ok(result.into())
}

static TAG: &str = "Users";

pub fn router() -> AppRouter<State> {
    AppRouter::new()
        .route(
            "/me",
            get_with(me, |o| {
                o.tag(TAG).id("user.get").summary("Get Current User")
            }),
        )
        .route(
            "/me",
            patch_with(update, |o| {
                o.tag(TAG).id("user.update").summary("Update User")
            }),
        )
        .route(
            "/me/handle",
            post_with(set_handle, |o| {
                o.tag(TAG)
                    .id("user.setHandle")
                    .summary("Set or Change User Handle")
            }),
        )
        .route(
            "/me/handle/verify",
            post_with(start_handle_verification, |o| {
                o.tag(TAG)
                    .id("user.startHandleVerification")
                    .summary("Start Custom Domain Verification")
                    .description("Generates a verification challenge for a custom domain handle. Returns the DNS TXT record and well-known file content to add for verification.")
            }),
        )
        .route(
            "/me/handle/verify/complete",
            post_with(complete_handle_verification, |o| {
                o.tag(TAG)
                    .id("user.completeHandleVerification")
                    .summary("Complete Custom Domain Verification")
                    .description("Verifies the custom domain by checking DNS TXT records or well-known files. On success, updates the user's handle to the verified domain.")
            }),
        )
        .on_ws(|router| {
            router
                .event("onCreate", |user: UserExt, _| async move { Some(user) })
                .event("onUpdate", |user: UserExt, _| async move { Some(user) })
                .event(
                    "onDelete",
                    |user: ObjectWithId, _| async move { Some(user) },
                )
        })
}
