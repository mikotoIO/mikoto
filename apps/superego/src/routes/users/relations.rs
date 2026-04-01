use aide::axum::routing::{get_with, post_with};
use axum::{extract::Path, Json};
use schemars::JsonSchema;

use uuid::Uuid;

use crate::{
    db::db,
    entities::{
        KeyPackage, KeyPackageExt, MlsGroup, MlsGroupExt, ObjectWithId, Relationship,
        RelationState, Space, SpaceExt, SpaceType, SpaceUser, User,
    },
    error::Error,
    functions::{jwt::Claims, pubsub::emit_event},
    routes::{router::AppRouter, ws::state::State},
};

async fn get(claim: Claims, Path(relation_id): Path<Uuid>) -> Result<Json<Relationship>, Error> {
    let user_id: Uuid = claim.sub.parse()?;
    Relationship::find_pair(user_id, relation_id, db())
        .await?
        .map(Json)
        .ok_or(Error::NotFound)
}

async fn list(claim: Claims) -> Result<Json<Vec<Relationship>>, Error> {
    let user_id: Uuid = claim.sub.parse()?;
    let relations = Relationship::list_for_user(user_id, db()).await?;
    Ok(relations.into())
}

async fn request(claim: Claims, Path(target_id): Path<Uuid>) -> Result<Json<Relationship>, Error> {
    let user_id: Uuid = claim.sub.parse()?;
    if user_id == target_id {
        return Err(Error::new(
            "CannotSelfRelate",
            axum::http::StatusCode::BAD_REQUEST,
            "Cannot send a friend request to yourself",
        ));
    }

    // Verify target user exists
    User::find_by_id(target_id, db()).await?;

    // Check if relationship already exists
    if let Some(existing) = Relationship::find_pair(user_id, target_id, db()).await? {
        return match existing.state {
            RelationState::Blocked => Err(Error::forbidden("Cannot send request to this user")),
            RelationState::Friend => Err(Error::new(
                "AlreadyFriends",
                axum::http::StatusCode::CONFLICT,
                "Already friends with this user",
            )),
            _ => Err(Error::new(
                "RequestExists",
                axum::http::StatusCode::CONFLICT,
                "A relationship already exists with this user",
            )),
        };
    }

    let (outgoing, _incoming) = Relationship::create_pair(
        user_id,
        target_id,
        RelationState::OutgoingRequest,
        RelationState::IncomingRequest,
        db(),
    )
    .await?;

    emit_event(
        "relations.onRequest",
        &_incoming,
        &format!("user:{target_id}"),
    )
    .await?;

    Ok(outgoing.into())
}

async fn accept(claim: Claims, Path(target_id): Path<Uuid>) -> Result<Json<Relationship>, Error> {
    let user_id: Uuid = claim.sub.parse()?;

    // Verify the incoming request exists
    let rel = Relationship::find_pair(user_id, target_id, db())
        .await?
        .ok_or(Error::NotFound)?;

    if rel.state != RelationState::IncomingRequest {
        return Err(Error::new(
            "NoIncomingRequest",
            axum::http::StatusCode::BAD_REQUEST,
            "No incoming friend request from this user",
        ));
    }

    // Update both sides to Friend
    let updated =
        Relationship::update_state(user_id, target_id, RelationState::Friend, db()).await?;
    Relationship::update_state(target_id, user_id, RelationState::Friend, db()).await?;

    emit_event(
        "relations.onAccept",
        &updated,
        &format!("user:{target_id}"),
    )
    .await?;

    Ok(updated.into())
}

async fn block(claim: Claims, Path(target_id): Path<Uuid>) -> Result<Json<Relationship>, Error> {
    let user_id: Uuid = claim.sub.parse()?;

    // Check if relationship exists
    if Relationship::find_pair(user_id, target_id, db())
        .await?
        .is_some()
    {
        // Update existing relationship
        let updated =
            Relationship::update_state(user_id, target_id, RelationState::Blocked, db()).await?;
        Ok(updated.into())
    } else {
        // Create new blocked relationship
        let (blocked, _) = Relationship::create_pair(
            user_id,
            target_id,
            RelationState::Blocked,
            RelationState::None,
            db(),
        )
        .await?;
        Ok(blocked.into())
    }
}

async fn remove(claim: Claims, Path(target_id): Path<Uuid>) -> Result<Json<()>, Error> {
    let user_id: Uuid = claim.sub.parse()?;

    Relationship::find_pair(user_id, target_id, db())
        .await?
        .ok_or(Error::NotFound)?;

    Relationship::delete_pair(user_id, target_id, db()).await?;

    emit_event(
        "relations.onRemove",
        ObjectWithId { id: target_id },
        &format!("user:{user_id}"),
    )
    .await?;
    emit_event(
        "relations.onRemove",
        ObjectWithId { id: user_id },
        &format!("user:{target_id}"),
    )
    .await?;

    Ok(().into())
}

#[derive(Serialize, Deserialize, JsonSchema)]
#[serde(rename_all = "camelCase")]
pub struct OpenDmResponse {
    pub space: SpaceExt,
    pub mls_group: MlsGroupExt,
    pub key_packages: Vec<KeyPackageExt>,
    /// True if this DM space was newly created (client must send Welcome messages)
    pub created: bool,
}

async fn open_dm(
    claim: Claims,
    Path(relation_id): Path<Uuid>,
) -> Result<Json<OpenDmResponse>, Error> {
    let user_id: Uuid = claim.sub.parse()?;

    let rel = Relationship::find_pair(user_id, relation_id, db())
        .await?
        .ok_or(Error::NotFound)?;

    if rel.state == RelationState::Blocked {
        return Err(Error::forbidden("Cannot open DM with this user"));
    }

    // If DM space already exists, return it
    if let Some(space_id) = rel.space_id {
        let space = Space::find_by_id(space_id, db()).await?;
        let space = SpaceExt::dataload_one(space, db()).await?;
        let mls_group = MlsGroup::find_by_space_id(space_id, db())
            .await?
            .ok_or(Error::internal("MLS group not found for DM space"))?;
        return Ok(Json(OpenDmResponse {
            space,
            mls_group: mls_group.into(),
            key_packages: vec![],
            created: false,
        }));
    }

    // Create new DM space
    let partner = User::find_by_id(relation_id, db()).await?;
    let me = User::find_by_id(user_id, db()).await?;

    let space = Space {
        id: Uuid::new_v4(),
        name: format!("{} & {}", me.name, partner.name),
        icon: None,
        owner_id: None,
        space_type: SpaceType::Dm,
        visibility: None,
    };
    // Create space with default channel and role
    space.create(db()).await?;

    // Add both users as members
    let member_a = SpaceUser::new(space.id, user_id);
    let member_b = SpaceUser::new(space.id, relation_id);
    member_a.create(db()).await?;
    member_b.create(db()).await?;

    // Create MLS group placeholder (client will fill in the real group_id)
    let mls_group = MlsGroup::create(space.id, space.id.as_bytes().to_vec(), db()).await?;

    // Update both relationship rows with the space_id
    Relationship::set_space_id(user_id, relation_id, space.id, db()).await?;

    let space = SpaceExt::dataload_one(space, db()).await?;

    // Fetch KeyPackages for the partner's devices (for MLS group creation)
    let partner_key_packages = KeyPackage::fetch_all_devices(relation_id, db()).await?;
    let key_packages: Vec<KeyPackageExt> = partner_key_packages.into_iter().map(Into::into).collect();

    // Notify the partner that a new DM space was created
    emit_event("spaces.onCreate", &space, &format!("user:{relation_id}")).await?;

    Ok(Json(OpenDmResponse {
        space,
        mls_group: mls_group.into(),
        key_packages,
        created: true,
    }))
}

static TAG: &str = "Relations";

pub fn router() -> AppRouter<State> {
    AppRouter::new()
        .route(
            "/",
            get_with(list, |o| {
                o.tag(TAG)
                    .id("relations.list")
                    .summary("List Relationships")
            }),
        )
        .route(
            "/:relationId",
            get_with(get, |o| {
                o.tag(TAG).id("relations.get").summary("Get Relationship")
            }),
        )
        .route(
            "/:userId/request",
            post_with(request, |o| {
                o.tag(TAG)
                    .id("relations.request")
                    .summary("Send Friend Request")
            }),
        )
        .route(
            "/:userId/accept",
            post_with(accept, |o| {
                o.tag(TAG)
                    .id("relations.accept")
                    .summary("Accept Friend Request")
            }),
        )
        .route(
            "/:userId/block",
            post_with(block, |o| {
                o.tag(TAG).id("relations.block").summary("Block User")
            }),
        )
        .route(
            "/:userId/remove",
            post_with(remove, |o| {
                o.tag(TAG)
                    .id("relations.remove")
                    .summary("Remove Relationship")
            }),
        )
        .route(
            "/:relationId/dm",
            post_with(open_dm, |o| {
                o.tag(TAG)
                    .id("relations.openDm")
                    .summary("Open Direct Messages")
            }),
        )
        .on_ws(|router| {
            router
                .event("onRequest", |rel: Relationship, _| async move {
                    Some(rel)
                })
                .event("onAccept", |rel: Relationship, _| async move {
                    Some(rel)
                })
                .event(
                    "onRemove",
                    |data: ObjectWithId, _| async move { Some(data) },
                )
        })
}
