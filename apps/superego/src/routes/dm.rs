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
        Channel, ChannelUnread, Message, MessageAttachment, MessageAttachmentInput, MessageExt,
        MessageKey, MessagePatch, Relationship,
    },
    error::Error,
    functions::{
        jwt::Claims,
        pubsub::emit_event,
        push::{self, PushPayload},
        time::Timestamp,
    },
    routes::{router::AppRouter, ws::state::State},
};

/// Verify the caller is a participant in a DM channel
async fn verify_dm_access(channel_id: Uuid, user_id: Uuid) -> Result<Channel, Error> {
    let channel = Channel::find_by_id(channel_id, db()).await?;
    if channel.space_id.is_some() {
        return Err(Error::NotFound);
    }
    Relationship::find_by_channel(channel_id, user_id, db())
        .await?
        .ok_or(Error::forbidden("You do not have access to this DM"))?;
    Ok(channel)
}

/// Get the other user's ID from a DM relationship
async fn get_dm_partner(channel_id: Uuid, user_id: Uuid) -> Result<Uuid, Error> {
    let rel = Relationship::find_by_channel(channel_id, user_id, db())
        .await?
        .ok_or(Error::NotFound)?;
    Ok(rel.relation_id)
}

#[derive(Deserialize, JsonSchema)]
#[serde(rename_all = "camelCase")]
pub struct MessageSendPayload {
    pub content: String,
    #[serde(default)]
    pub attachments: Vec<MessageAttachmentInput>,
}

#[derive(Deserialize, JsonSchema)]
#[serde(rename_all = "camelCase")]
struct ListQuery {
    #[serde(skip_serializing_if = "Option::is_none")]
    limit: Option<i32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    cursor: Option<Uuid>,
}

async fn list(
    claim: Claims,
    Path(channel_id): Path<Uuid>,
    Query(query): Query<ListQuery>,
) -> Result<Json<Vec<MessageExt>>, Error> {
    let user_id: Uuid = claim.sub.parse()?;
    verify_dm_access(channel_id, user_id).await?;

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
    Path(channel_id): Path<Uuid>,
    Json(body): Json<MessageSendPayload>,
) -> Result<Json<MessageExt>, Error> {
    let user_id: Uuid = claim.sub.parse()?;
    let channel = verify_dm_access(channel_id, user_id).await?;
    let partner_id = get_dm_partner(channel_id, user_id).await?;

    let message = Message::new(&channel, user_id, body.content);
    message.create(db()).await?;

    Channel::update_last_updated(channel_id, message.timestamp, db()).await?;

    for (i, attachment_input) in body.attachments.into_iter().enumerate() {
        let attachment = MessageAttachment::new(message.id, attachment_input, i as i32);
        attachment.create(db()).await?;
    }

    let message = MessageExt::dataload_one(message, db()).await?;

    // Emit to both DM participants
    emit_event("messages.onCreate", &message, &format!("user:{user_id}")).await?;
    emit_event("messages.onCreate", &message, &format!("user:{partner_id}")).await?;

    if push::is_enabled() {
        let title = message
            .author
            .as_ref()
            .map(|a| a.name.clone())
            .unwrap_or_else(|| "New message".to_string());
        let body = truncate(&message.base.content, 140);
        let icon = message.author.as_ref().and_then(|a| a.avatar.clone());
        let payload = PushPayload {
            title,
            body,
            url: format!("/dm/{channel_id}"),
            icon,
            tag: format!("dm:{channel_id}"),
        };
        tokio::spawn(async move {
            push::send_to_user(partner_id, &payload).await;
        });
    }

    Ok(message.into())
}

fn truncate(s: &str, max_chars: usize) -> String {
    if s.chars().count() <= max_chars {
        return s.to_string();
    }
    let mut out: String = s.chars().take(max_chars).collect();
    out.push('…');
    out
}

#[derive(Deserialize, JsonSchema)]
#[serde(rename_all = "camelCase")]
pub struct MessageEditPayload {
    pub content: String,
}

async fn edit(
    claim: Claims,
    Path((channel_id, message_id)): Path<(Uuid, Uuid)>,
    Json(body): Json<MessageEditPayload>,
) -> Result<Json<MessageExt>, Error> {
    let user_id: Uuid = claim.sub.parse()?;
    verify_dm_access(channel_id, user_id).await?;
    let partner_id = get_dm_partner(channel_id, user_id).await?;

    let message = Message::find_by_id(message_id, db()).await?;
    if message.channel_id != channel_id {
        return Err(Error::NotFound);
    }
    if message.author_id != Some(user_id) {
        return Err(Error::forbidden("You can only edit your own messages"));
    }

    let message = message
        .update(MessagePatch::edit(body.content), db())
        .await?;
    let message = MessageExt::dataload_one(message, db()).await?;

    emit_event("messages.onUpdate", &message, &format!("user:{user_id}")).await?;
    emit_event("messages.onUpdate", &message, &format!("user:{partner_id}")).await?;

    Ok(message.into())
}

async fn delete(
    claim: Claims,
    Path((channel_id, message_id)): Path<(Uuid, Uuid)>,
) -> Result<Json<()>, Error> {
    let user_id: Uuid = claim.sub.parse()?;
    verify_dm_access(channel_id, user_id).await?;
    let partner_id = get_dm_partner(channel_id, user_id).await?;

    let message = Message::find_by_id(message_id, db()).await?;
    if message.channel_id != channel_id {
        return Err(Error::NotFound);
    }
    if message.author_id != Some(user_id) {
        return Err(Error::forbidden("You can only delete your own messages"));
    }

    message.delete(db()).await?;

    let key = MessageKey {
        message_id: message.id,
        channel_id: message.channel_id,
    };
    emit_event("messages.onDelete", &key, &format!("user:{user_id}")).await?;
    emit_event("messages.onDelete", &key, &format!("user:{partner_id}")).await?;

    Ok(().into())
}

async fn acknowledge(claim: Claims, Path(channel_id): Path<Uuid>) -> Result<Json<()>, Error> {
    let user_id: Uuid = claim.sub.parse()?;
    verify_dm_access(channel_id, user_id).await?;
    ChannelUnread::upsert(channel_id, user_id, Timestamp::now(), db()).await?;
    Ok(().into())
}

async fn list_unreads(claim: Claims) -> Result<Json<Vec<ChannelUnread>>, Error> {
    let user_id: Uuid = claim.sub.parse()?;
    let unreads = ChannelUnread::list_dms_by_user(user_id, db()).await?;
    Ok(unreads.into())
}

static TAG: &str = "DM";

pub fn router() -> AppRouter<State> {
    AppRouter::new()
        .route(
            "/",
            get_with(list, |o| {
                o.tag(TAG)
                    .id("dm.messages.list")
                    .summary("List DM Messages")
            }),
        )
        .route(
            "/",
            post_with(send, |o| {
                o.tag(TAG)
                    .id("dm.messages.create")
                    .summary("Send DM Message")
            }),
        )
        .route(
            "/:messageId",
            patch_with(edit, |o| {
                o.tag(TAG)
                    .id("dm.messages.update")
                    .summary("Edit DM Message")
            }),
        )
        .route(
            "/:messageId",
            delete_with(delete, |o| {
                o.tag(TAG)
                    .id("dm.messages.delete")
                    .summary("Delete DM Message")
            }),
        )
}

pub fn channel_router() -> AppRouter<State> {
    AppRouter::new()
        .route(
            "/unreads",
            get_with(list_unreads, |o| {
                o.tag(TAG)
                    .id("dm.unreads")
                    .summary("List DM Unreads")
            }),
        )
        .route(
            "/:channelId/ack",
            post_with(acknowledge, |o| {
                o.tag(TAG)
                    .id("dm.acknowledge")
                    .summary("Acknowledge DM Channel")
            }),
        )
}
