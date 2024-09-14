use aide::axum::routing::{delete_with, get_with, patch_with, post_with};
use axum::{extract::Path, Json};
use schemars::JsonSchema;
use uuid::Uuid;

use crate::{
    entities::MessageExt,
    error::Error,
    routes::{router::AppRouter, ws::state::State},
};

#[derive(Deserialize, JsonSchema)]
#[serde(rename_all = "camelCase")]
pub struct MessageSendPayload {
    pub content: String,
}

#[derive(Deserialize, JsonSchema)]
#[serde(rename_all = "camelCase")]
pub struct MessageEditPayload {
    pub content: String,
}

async fn get(_id: Path<(Uuid, Uuid)>) -> Result<Json<MessageExt>, Error> {
    Err(Error::Todo)
}

async fn list(_channel_id: Path<Uuid>) -> Result<Json<Vec<MessageExt>>, Error> {
    Err(Error::Todo)
}

async fn send(
    _channel_id: Path<Uuid>,
    _body: Json<MessageSendPayload>,
) -> Result<Json<MessageExt>, Error> {
    Err(Error::Todo)
}

async fn edit(
    _id: Path<(Uuid, Uuid)>,
    _body: Json<MessageEditPayload>,
) -> Result<Json<MessageExt>, Error> {
    Err(Error::Todo)
}

async fn delete(_id: Path<(Uuid, Uuid)>) -> Result<Json<()>, Error> {
    Err(Error::Todo)
}

static TAG: &str = "Messages";

pub fn router() -> AppRouter<State> {
    AppRouter::new()
        .route(
            "/",
            get_with(list, |o| {
                o.tag(TAG).id("messages.list").summary("List Messages")
            }),
        )
        .route(
            "/:id",
            get_with(get, |o| {
                o.tag(TAG).id("messages.get").summary("Get Message")
            }),
        )
        .route(
            "/",
            post_with(send, |o| {
                o.tag(TAG).id("messages.create").summary("Create Message")
            }),
        )
        .route(
            "/:id",
            patch_with(edit, |o| {
                o.tag(TAG).id("messages.update").summary("Update Message")
            }),
        )
        .route(
            "/:id",
            delete_with(delete, |o| {
                o.tag(TAG).id("messages.delete").summary("Delete Message")
            }),
        )
        .on_ws(|router| {
            router
                .event("onCreate", |message: MessageExt, _| Some(message))
                .event("onUpdate", |message: MessageExt, _| Some(message))
                .event("onDelete", |message: MessageExt, _| Some(message))
        })
}
