use aide::axum::routing::{delete_with, get_with, patch_with, post_with};
use axum::{
    extract::{Path, Query},
    Json,
};
use schemars::JsonSchema;
use uuid::Uuid;

use crate::{
    db::db,
    entities::{
        Channel, MemberExt, Message, MessageAttachment, MessageAttachmentInput, MessageExt,
        MessageKey, MessagePatch, SpaceExt,
    },
    error::Error,
    functions::{
        jwt::Claims,
        permissions::{permissions_or_moderator, Permission},
        pubsub::emit_event,
    },
    middlewares::load::Load,
    routes::{router::AppRouter, ws::state::State},
};

#[derive(Deserialize, JsonSchema)]
#[serde(rename_all = "camelCase")]
pub struct MessageSendPayload {
    pub content: String,
    #[serde(default)]
    pub attachments: Vec<MessageAttachmentInput>,
}

#[derive(Deserialize, JsonSchema)]
#[serde(rename_all = "camelCase")]
pub struct MessageEditPayload {
    pub content: String,
}

async fn get(
    _claim: Claims,
    _member: Load<MemberExt>,
    Load(space): Load<SpaceExt>,
    Path((_, _, message_id)): Path<(Uuid, Uuid, Uuid)>,
) -> Result<Json<MessageExt>, Error> {
    let message = Message::find_by_id(message_id, db()).await?;
    // Verify message's channel belongs to this space
    let channel = Channel::find_by_id(message.channel_id, db()).await?;
    if channel.space_id != Some(space.base.id) {
        return Err(Error::NotFound);
    }
    let message = MessageExt::dataload_one(message, db()).await?;
    Ok(message.into())
}

#[derive(Deserialize, JsonSchema)]
struct MessageListQuery {
    limit: Option<i32>,
    cursor: Option<Uuid>,
}

async fn list(
    _claim: Claims,
    _member: Load<MemberExt>,
    Load(space): Load<SpaceExt>,
    Path((_, channel_id)): Path<(Uuid, Uuid)>,
    Query(query): Query<MessageListQuery>,
) -> Result<Json<Vec<MessageExt>>, Error> {
    // Verify channel belongs to this space
    let channel = Channel::find_by_id(channel_id, db()).await?;
    if channel.space_id != Some(space.base.id) {
        return Err(Error::NotFound);
    }
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
    claim: Claims,
    _member: Load<MemberExt>,
    Load(space): Load<SpaceExt>,
    Path((_, channel_id)): Path<(Uuid, Uuid)>,
    Json(body): Json<MessageSendPayload>,
) -> Result<Json<MessageExt>, Error> {
    let channel = Channel::find_by_id(channel_id, db()).await?;
    if channel.space_id != Some(space.base.id) {
        return Err(Error::NotFound);
    }
    let message = Message::new(&channel, claim.sub.parse()?, body.content);
    message.create(db()).await?;

    Channel::update_last_updated(channel_id, message.timestamp, db()).await?;

    // Create attachments if any
    let attachments: Vec<MessageAttachment> = body
        .attachments
        .into_iter()
        .enumerate()
        .map(|(i, input)| MessageAttachment::new(message.id, input, i as i32))
        .collect();
    MessageAttachment::create_many(&attachments, db()).await?;

    let message = MessageExt::dataload_one(message, db()).await?;

    emit_event(
        "messages.onCreate",
        &message,
        &format!("space:{}", space.base.id),
    )
    .await?;
    Ok(message.into())
}

async fn edit(
    claim: Claims,
    _member: Load<MemberExt>,
    Load(space): Load<SpaceExt>,
    Path((_, channel_id, message_id)): Path<(Uuid, Uuid, Uuid)>,
    Json(body): Json<MessageEditPayload>,
) -> Result<Json<MessageExt>, Error> {
    let channel = Channel::find_by_id(channel_id, db()).await?;
    if channel.space_id != Some(space.base.id) {
        return Err(Error::NotFound);
    }
    let message = Message::find_by_id(message_id, db()).await?;
    if message.channel_id != channel_id {
        return Err(Error::NotFound);
    }

    // Only the message author can edit their own messages
    let user_id: Uuid = claim.sub.parse()?;
    if message.author_id != Some(user_id) {
        return Err(Error::forbidden("You can only edit your own messages"));
    }

    let message = message
        .update(MessagePatch::edit(body.content), db())
        .await?;
    let message = MessageExt::dataload_one(message, db()).await?;

    emit_event(
        "messages.onUpdate",
        &message,
        &format!("space:{}", space.base.id),
    )
    .await?;
    Ok(message.into())
}

async fn delete(
    claim: Claims,
    Load(space): Load<SpaceExt>,
    Load(member): Load<MemberExt>,
    Path((_, channel_id, message_id)): Path<(Uuid, Uuid, Uuid)>,
) -> Result<Json<()>, Error> {
    let channel = Channel::find_by_id(channel_id, db()).await?;
    if channel.space_id != Some(space.base.id) {
        return Err(Error::NotFound);
    }
    let message = Message::find_by_id(message_id, db()).await?;
    if message.channel_id != channel_id {
        return Err(Error::NotFound);
    }

    // Author can delete their own messages; moderators+ can delete anyone's
    let user_id: Uuid = claim.sub.parse()?;
    if message.author_id != Some(user_id) {
        permissions_or_moderator(&space, &member, Permission::MANAGE_MESSAGES)?;
    }

    message.delete(db()).await?;

    emit_event(
        "messages.onDelete",
        MessageKey {
            message_id: message.id,
            channel_id: message.channel_id,
        },
        &format!("space:{}", space.base.id),
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
            "/:messageId",
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
            "/:messageId",
            patch_with(edit, |o| {
                o.tag(TAG).id("messages.update").summary("Update Message")
            }),
        )
        .route(
            "/:messageId",
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
