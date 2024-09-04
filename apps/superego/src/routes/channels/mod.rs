use aide::axum::{
    routing::{delete_with, get_with, patch_with, post_with},
    ApiRouter,
};
use axum::{extract::Path, Json};
use schemars::JsonSchema;
use uuid::Uuid;

use crate::{entities::Channel, error::Error};

pub mod documents;
pub mod messages;

#[derive(Deserialize, JsonSchema)]
#[serde(rename_all = "camelCase")]
pub struct ChannelCreatePayload {
    pub name: String,
}

#[derive(Deserialize, JsonSchema)]
#[serde(rename_all = "camelCase")]
pub struct ChannelUpdatePayload {
    pub name: String,
}

async fn get(_id: Path<Uuid>) -> Result<Json<Channel>, Error> {
    Err(Error::Todo)
}

async fn list() -> Result<Json<Vec<Channel>>, Error> {
    Err(Error::Todo)
}

async fn create(_body: Json<ChannelCreatePayload>) -> Result<Json<Channel>, Error> {
    Err(Error::Todo)
}

async fn update(
    _id: Path<Uuid>,
    _body: Json<ChannelUpdatePayload>,
) -> Result<Json<Channel>, Error> {
    Err(Error::Todo)
}

async fn delete(_id: Path<Uuid>) -> Result<Json<()>, Error> {
    Err(Error::Todo)
}

static TAG: &str = "Channels";

pub fn router() -> ApiRouter {
    ApiRouter::<()>::new()
        .api_route("/", get_with(list, |o| o.tag(TAG).summary("List Channels")))
        .api_route("/:id", get_with(get, |o| o.tag(TAG).summary("Get Channel")))
        .api_route(
            "/",
            post_with(create, |o| o.tag(TAG).summary("Create Channel")),
        )
        .api_route(
            "/:id",
            patch_with(update, |o| o.tag(TAG).summary("Update Channel")),
        )
        .api_route(
            "/:id",
            delete_with(delete, |o| o.tag(TAG).summary("Delete Channel")),
        )
}
