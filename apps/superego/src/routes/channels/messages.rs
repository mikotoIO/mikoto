use aide::axum::routing::{delete_with, get_with, patch_with, post_with};
use axum::{
    extract::{Path, Query},
    Json,
};
use schemars::JsonSchema;
use uuid::Uuid;

use crate::{
    db::db,
    entities::{Channel, Message, MessageExt, MessageKey, MessagePatch},
    error::Error,
    functions::{jwt::Claims, pubsub::emit_event},
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

async fn get(
    Path((_, _, message_id)): Path<(Uuid, Uuid, Uuid)>,
) -> Result<Json<MessageExt>, Error> {
    let message = Message::find_by_id(message_id, db()).await?;
    let message = MessageExt::dataload_one(message, db()).await?;
    Ok(message.into())
}

#[derive(Deserialize, JsonSchema)]
struct ListQuery {
    #[serde(skip_serializing_if = "Option::is_none")]
    limit: Option<i32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    cursor: Option<Uuid>,
}

async fn list(
    Path((_, channel_id)): Path<(Uuid, Uuid)>,
    Query(query): Query<ListQuery>,
) -> Result<Json<Vec<MessageExt>>, Error> {
    let messages = Message::paginate(
        channel_id,
        query.cursor,
        query.limit.unwrap_or(50).clamp(1, 100),
        db(),
    )
    .await?;
    let messages = MessageExt::dataload(messages, db()).await?;
    Ok(messages.into())
}

async fn send(
    Path((_, channel_id)): Path<(Uuid, Uuid)>,
    claim: Claims,
    Json(body): Json<MessageSendPayload>,
) -> Result<Json<MessageExt>, Error> {
    let channel = Channel::find_by_id(channel_id, db()).await?;
    let message = Message::new(&channel, claim.sub.parse()?, body.content);
    message.create(db()).await?;
    let message = MessageExt::dataload_one(message, db()).await?;

    emit_event(
        "messages.onCreate",
        &message,
        &format!("space:{}", channel.space_id),
    )
    .await?;
    Ok(message.into())
}

async fn edit(
    Path((_, channel_id, message_id)): Path<(Uuid, Uuid, Uuid)>,
    Json(body): Json<MessageEditPayload>,
) -> Result<Json<MessageExt>, Error> {
    let _channel = Channel::find_by_id(channel_id, db()).await?;
    let message = Message::find_by_id(message_id, db()).await?;
    let message = message
        .update(MessagePatch::edit(body.content), db())
        .await?;
    let message = MessageExt::dataload_one(message, db()).await?;

    emit_event(
        "messages.onUpdate",
        &message,
        &format!("space:{}", channel_id),
    )
    .await?;
    Ok(message.into())
}

async fn delete(
    Path((_, channel_id, message_id)): Path<(Uuid, Uuid, Uuid)>,
) -> Result<Json<()>, Error> {
    let _channel = Channel::find_by_id(channel_id, db()).await?;
    let message = Message::find_by_id(message_id, db()).await?;
    message.delete(db()).await?;

    emit_event(
        "messages.onDelete",
        MessageKey {
            message_id: message.id,
            channel_id: message.channel_id,
        },
        &format!("space:{}", channel_id),
    )
    .await?;
    Ok(().into())
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
        .ws_event(
            "onCreate",
            |message: MessageExt, _| async move { Some(message) },
        )
        .ws_event(
            "onUpdate",
            |message: MessageExt, _| async move { Some(message) },
        )
        .ws_event(
            "onDelete",
            |message: MessageKey, _| async move { Some(message) },
        )
}
