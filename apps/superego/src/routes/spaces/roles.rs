use aide::axum::{
    routing::{delete_with, patch_with, post_with},
    ApiRouter,
};
use axum::{extract::Path, Json};
use schemars::JsonSchema;
use uuid::Uuid;

use crate::{entities::Role, error::Error};

#[derive(Deserialize, JsonSchema)]
#[serde(rename_all = "camelCase")]
pub struct RoleCreatePayload {
    pub name: String,
}

#[derive(Deserialize, JsonSchema)]
#[serde(rename_all = "camelCase")]
pub struct RoleUpdatePayload {
    pub name: String,
}

async fn create(
    _space_id: Path<Uuid>,
    _body: Json<RoleCreatePayload>,
) -> Result<Json<Role>, Error> {
    Err(Error::Todo)
}

async fn update(
    _id: Path<(Uuid, Uuid)>,
    _body: Json<RoleUpdatePayload>,
) -> Result<Json<Role>, Error> {
    Err(Error::Todo)
}

async fn delete(_id: Path<(Uuid, Uuid)>) -> Result<Json<()>, Error> {
    Err(Error::Todo)
}

static TAG: &str = "Roles";

pub fn router() -> ApiRouter {
    ApiRouter::<()>::new()
        .api_route(
            "/",
            post_with(create, |o| o.tag(TAG).summary("Create Role")),
        )
        .api_route(
            "/:role_id",
            patch_with(update, |o| o.tag(TAG).summary("Update Role")),
        )
        .api_route(
            "/:role_id",
            delete_with(delete, |o| o.tag(TAG).summary("Delete Role")),
        )
}
