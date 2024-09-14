use aide::axum::routing::{delete_with, get_with, patch_with, post_with};
use axum::{extract::Path, Json};
use schemars::JsonSchema;
use uuid::Uuid;

use crate::{
    entities::{Channel, ChannelType},
    error::Error,
};

use super::{router::AppRouter, ws::state::State};

pub mod documents;
pub mod messages;
pub mod voice;

#[derive(Deserialize, JsonSchema)]
#[serde(rename_all = "camelCase")]
pub struct ChannelCreatePayload {
    pub name: String,
    pub parent_id: Option<Uuid>,

    #[serde(rename = "type")]
    pub kind: Option<ChannelType>,
}

#[derive(Deserialize, JsonSchema)]
#[serde(rename_all = "camelCase")]
pub struct ChannelUpdatePayload {
    pub name: Option<String>,
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

pub fn router() -> AppRouter<State> {
    AppRouter::new()
        .route(
            "/",
            get_with(list, |o| {
                o.tag(TAG).id("channels.list").summary("List Channels")
            }),
        )
        .route(
            "/:id",
            get_with(get, |o| {
                o.tag(TAG).id("channels.get").summary("Get Channel")
            }),
        )
        .route(
            "/",
            post_with(create, |o| {
                o.tag(TAG).id("channels.create").summary("Create Channel")
            }),
        )
        .route(
            "/:id",
            patch_with(update, |o| {
                o.tag(TAG).id("channels.update").summary("Update Channel")
            }),
        )
        .route(
            "/:id",
            delete_with(delete, |o| {
                o.id("channels.delete").tag(TAG).summary("Delete Channel")
            }),
        )
        .on_ws(|router| {
            router
                .event("onCreate", |channel: Channel, _| Some(channel))
                .event("onUpdate", |channel: Channel, _| Some(channel))
                .event("onDelete", |channel: Channel, _| Some(channel))
        })
}
