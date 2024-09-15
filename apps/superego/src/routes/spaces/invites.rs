use aide::axum::routing::{delete_with, get_with, post_with};
use axum::{extract::Path, Json};
use schemars::JsonSchema;
use uuid::Uuid;

use crate::{
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
    Err(Error::Todo)
}

async fn list(_space_id: Path<Uuid>) -> Result<Json<Vec<Invite>>, Error> {
    Err(Error::Todo)
}

async fn delete(_id: Path<(Uuid, Uuid)>) -> Result<Json<()>, Error> {
    Err(Error::Todo)
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
            "/:invite_id",
            delete_with(delete, |o| {
                o.tag(TAG).id("invites.delete").summary("Delete Invite")
            }),
        )
}
