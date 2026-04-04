use aide::axum::routing::{get_with, post_with};
use axum::{
    extract::{Path, Query},
    Json,
};
use schemars::JsonSchema;
use uuid::Uuid;

use crate::{
    db::db,
    entities::{
        Channel, Message, MessageAttachment, MessageAttachmentInput, MessageExt, Relationship,
    },
    error::Error,
    functions::{jwt::Claims, pubsub::emit_event},
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

    for (i, attachment_input) in body.attachments.into_iter().enumerate() {
        let attachment = MessageAttachment::new(message.id, attachment_input, i as i32);
        attachment.create(db()).await?;
    }

    let message = MessageExt::dataload_one(message, db()).await?;

    // Emit to both DM participants
    emit_event(
        "messages.onCreate",
        &message,
        &format!("user:{user_id}"),
    )
    .await?;
    emit_event(
        "messages.onCreate",
        &message,
        &format!("user:{partner_id}"),
    )
    .await?;

    Ok(message.into())
}

static TAG: &str = "DM";

pub fn router() -> AppRouter<State> {
    AppRouter::new()
        .route(
            "/",
            get_with(list, |o| {
                o.tag(TAG).id("dm.messages.list").summary("List DM Messages")
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
}
