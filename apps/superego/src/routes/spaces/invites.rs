use aide::axum::routing::{delete_with, get_with, post_with};
use axum::{extract::Path, Json};
use nanoid::nanoid;
use schemars::JsonSchema;
use uuid::Uuid;

use crate::{
    db::db,
    entities::Invite,
    error::Error,
    routes::{router::AppRouter, ws::state::State},
};

static TAG: &str = "Spaces";

#[derive(Deserialize, JsonSchema)]
#[serde(rename_all = "camelCase")]
pub struct InviteCreatePayload {}

async fn create(
    _space_id: Path<Uuid>,
    _body: Json<InviteCreatePayload>,
) -> Result<Json<Invite>, Error> {
    let invite = Invite {
        id: nanoid!(12),
        space_id: Uuid::new_v4(),
        created_at: chrono::Utc::now().naive_utc(),
        creator_id: Uuid::new_v4(),
    };
    invite.create(db()).await?;
    Ok(invite.into())
}

async fn list(_space_id: Path<Uuid>) -> Result<Json<Vec<Invite>>, Error> {
    Ok(Json(vec![]))
}

async fn delete(Path((_space_id, invite_id)): Path<(Uuid, Uuid)>) -> Result<Json<()>, Error> {
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
