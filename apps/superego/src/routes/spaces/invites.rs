use aide::axum::routing::{delete_with, get_with, post_with};
use axum::{extract::Path, Json};
use nanoid::nanoid;
use schemars::JsonSchema;
use uuid::Uuid;

use crate::{
    db::db,
    entities::{Invite, MemberExt, SpaceExt},
    error::Error,
    functions::{
        jwt::Claims,
        permissions::{permissions_or_moderator, Permission},
        time::Timestamp,
    },
    middlewares::load::Load,
    routes::{router::AppRouter, ws::state::State},
};

static TAG: &str = "Spaces";

#[derive(Deserialize, JsonSchema)]
#[serde(rename_all = "camelCase")]
pub struct InviteCreatePayload {}

async fn create(
    Path(space_id): Path<Uuid>,
    claim: Claims,
    Load(space): Load<SpaceExt>,
    Load(member): Load<MemberExt>,
    _body: Json<InviteCreatePayload>,
) -> Result<Json<Invite>, Error> {
    permissions_or_moderator(&space, &member, Permission::MANAGE_INVITES)?;
    let invite = Invite {
        id: nanoid!(12),
        space_id,
        created_at: Timestamp::now(),
        creator_id: claim.sub.parse()?,
    };
    invite.create(db()).await?;
    Ok(invite.into())
}

async fn list(
    Path(space_id): Path<Uuid>,
    Load(space): Load<SpaceExt>,
    Load(member): Load<MemberExt>,
) -> Result<Json<Vec<Invite>>, Error> {
    permissions_or_moderator(&space, &member, Permission::MANAGE_INVITES)?;

    let res = Invite::list_by_space_id(space_id, db()).await?;
    Ok(Json(res))
}

async fn delete(
    Path((_space_id, invite_id)): Path<(Uuid, Uuid)>,
    Load(space): Load<SpaceExt>,
    Load(member): Load<MemberExt>,
) -> Result<Json<()>, Error> {
    permissions_or_moderator(&space, &member, Permission::MANAGE_INVITES)?;

    Invite::delete(&invite_id.to_string(), db()).await?;
    Ok(Json(()))
}

pub fn router() -> AppRouter<State> {
    AppRouter::new()
        .route(
            "/",
            post_with(create, |o| {
                o.tag(TAG).id("invites.create").summary("Create Invite")
            }),
        )
        .route(
            "/",
            get_with(list, |o| {
                o.tag(TAG).id("invites.list").summary("List Invites")
            }),
        )
        .route(
            "/:inviteId",
            delete_with(delete, |o| {
                o.tag(TAG).id("invites.delete").summary("Delete Invite")
            }),
        )
}
