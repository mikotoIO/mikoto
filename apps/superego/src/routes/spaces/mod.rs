use aide::axum::{
    routing::{delete_with, get_with, patch_with, post_with},
    ApiRouter,
};
use axum::{extract::Path, Json};
use schemars::JsonSchema;
use uuid::Uuid;

use crate::{entities::SpaceExt, error::Error};

pub mod roles;

#[derive(Deserialize, JsonSchema)]
#[serde(rename_all = "camelCase")]
pub struct SpaceCreatePayload {
    pub name: String,
}

#[derive(Deserialize, JsonSchema)]
#[serde(rename_all = "camelCase")]
pub struct SpaceUpdatePayload {
    pub name: String,
}

async fn get(_id: Path<Uuid>) -> Result<Json<SpaceExt>, Error> {
    Err(Error::Todo)
}

async fn list() -> Result<Json<Vec<SpaceExt>>, Error> {
    Err(Error::Todo)
}

async fn create(_body: Json<SpaceCreatePayload>) -> Result<Json<SpaceExt>, Error> {
    Err(Error::Todo)
}

async fn update(_id: Path<Uuid>, _body: Json<SpaceUpdatePayload>) -> Result<Json<SpaceExt>, Error> {
    Err(Error::Todo)
}

async fn delete(_id: Path<Uuid>) -> Result<Json<()>, Error> {
    Err(Error::Todo)
}

static TAG: &str = "Spaces";

pub fn router() -> ApiRouter {
    ApiRouter::<()>::new()
        .api_route("/", get_with(list, |o| o.tag(TAG).summary("List Spaces")))
        .api_route("/:id", get_with(get, |o| o.tag(TAG).summary("Get Space")))
        .api_route(
            "/",
            post_with(create, |o| o.tag(TAG).summary("Create Space")),
        )
        .api_route(
            "/:id",
            patch_with(update, |o| o.tag(TAG).summary("Update Space")),
        )
        .api_route(
            "/:id",
            delete_with(delete, |o| o.tag(TAG).summary("Delete Space")),
        )
}
