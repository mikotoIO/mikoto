use std::sync::Arc;

use aide::axum::routing::{delete_with, get_with, patch_with, post_with};
use axum::{extract::Path, Json};
use schemars::JsonSchema;
use tokio::sync::RwLock;
use uuid::Uuid;

use crate::{
    db::db,
    entities::{Invite, MemberExt, MemberKey, Space, SpaceExt, SpacePatch, SpaceUser},
    error::Error,
    functions::{jwt::Claims, pubsub::emit_event},
};

use super::{
    router::AppRouter,
    ws::{state::State, SocketAction},
};

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
}

impl From<SpaceUpdatePayload> for SpacePatch {
    fn from(body: SpaceUpdatePayload) -> Self {
        Self {
            name: body.name,
            icon: body.icon,
            ..Default::default()
        }
    }
}

async fn join_space(space: &SpaceExt, user_id: Uuid) -> Result<(), Error> {
    let member = SpaceUser::new(space.base.id, user_id);
    member.create(db()).await?;
    let member = MemberExt::dataload_one(member, db()).await?;

    emit_event(
        "members.onCreate",
        member,
        &format!("space:{}", space.base.id),
    )
    .await?;
    emit_event("spaces.onCreate", space, &format!("user:{}", user_id)).await?;
    Ok(())
}

async fn leave_space(space: &SpaceExt, user_id: Uuid) -> Result<(), Error> {
    let key = MemberKey {
        space_id: space.base.id,
        user_id,
    };
    SpaceUser::delete_by_key(&key, db()).await?;
    emit_event("members.onDelete", key, &format!("space:{}", space.base.id)).await?;
    emit_event("spaces.onDelete", &space, &format!("user:{}", user_id)).await?;
    Ok(())
}

async fn get(Path(space_id): Path<Uuid>) -> Result<Json<SpaceExt>, Error> {
    // TODO: Check if the member is in space
    let space = Space::find_by_id(space_id, db()).await?;
    let space = SpaceExt::dataload_one(space, db()).await?;
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
    Json(body): Json<SpaceUpdatePayload>,
) -> Result<Json<SpaceExt>, Error> {
    // TODO: Check update rights
    let space = Space::find_by_id(space_id, db()).await?;
    let space = space.update(body.into(), db()).await?;
    let space = SpaceExt::dataload_one(space, db()).await?;
    emit_event(
        "spaces.onUpdate",
        &space,
        &format!("space:{}", space.base.id),
    )
    .await?;
    Ok(space.into())
}

async fn delete(Path(space_id): Path<Uuid>, claims: Claims) -> Result<Json<()>, Error> {
    let space = Space::find_by_id(space_id, db()).await?;
    let space = SpaceExt::dataload_one(space, db()).await?;
    if space.base.owner_id == Some(claims.sub.parse()?) {
        space.base.delete(db()).await?;
        emit_event("spaces.onDelete", &space, &format!("user:{}", claims.sub)).await?;
    } else {
        return Err(Error::Unauthorized {
            message: "Only the owner may delete the space".to_string(),
        });
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
    leave_space(&space, claims.sub.parse()?).await?;
    Ok(().into())
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
