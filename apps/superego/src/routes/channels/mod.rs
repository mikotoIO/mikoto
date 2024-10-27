use aide::axum::routing::{delete_with, get_with, patch_with, post_with};
use axum::{extract::Path, Json};
use schemars::JsonSchema;
use uuid::Uuid;

use crate::{
    db::db,
    entities::{Channel, ChannelPatch, ChannelType, ChannelUnread, Document, MemberExt, SpaceExt},
    error::Error,
    functions::{
        permissions::{permissions_or_admin, Permission},
        pubsub::emit_event, time::Timestamp,
    },
    middlewares::load::Load,
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

async fn get(Path((_, channel_id)): Path<(Uuid, Uuid)>) -> Result<Json<Channel>, Error> {
    let channel = Channel::find_by_id(channel_id, db()).await?;
    Ok(channel.into())
}

async fn list(Path(space_id): Path<Uuid>) -> Result<Json<Vec<Channel>>, Error> {
    let channels = Channel::list(space_id, db()).await?;
    Ok(channels.into())
}

async fn create(
    Path(space_id): Path<Uuid>,
    Load(space): Load<SpaceExt>,
    Load(member): Load<MemberExt>,
    Json(body): Json<ChannelCreatePayload>,
) -> Result<Json<Channel>, Error> {
    permissions_or_admin(&space, &member, Permission::MANAGE_CHANNELS)?;

    let channel = Channel {
        id: Uuid::new_v4(),
        space_id,
        name: body.name,
        parent_id: body.parent_id,
        category: body.kind.unwrap_or(ChannelType::Text),
        order: 0,
        last_updated: Some(Timestamp::now()),
    };
    channel.create(db()).await?;

    if channel.category == ChannelType::Document {
        Document {
            id: Uuid::new_v4(),
            channel_id: channel.id,
            content: "".to_string(),
        }
        .create(db())
        .await?;
    }
    emit_event(
        "channels.onCreate",
        &channel,
        &format!("space:{}", space_id),
    )
    .await?;

    Ok(channel.into())
}

async fn update(
    Path((_, channel_id)): Path<(Uuid, Uuid)>,
    Load(space): Load<SpaceExt>,
    Load(member): Load<MemberExt>,
    Json(patch): Json<ChannelPatch>,
) -> Result<Json<Channel>, Error> {
    permissions_or_admin(&space, &member, Permission::MANAGE_CHANNELS)?;

    let channel = Channel::find_by_id(channel_id, db()).await?;
    let channel = channel.update(patch, db()).await?;
    emit_event(
        "channels.onUpdate",
        &channel,
        &format!("space:{}", channel.space_id),
    )
    .await?;
    Ok(channel.into())
}

async fn delete(
    Path((_, channel_id)): Path<(Uuid, Uuid)>,
    Load(space): Load<SpaceExt>,
    Load(member): Load<MemberExt>,
) -> Result<Json<()>, Error> {
    permissions_or_admin(&space, &member, Permission::MANAGE_CHANNELS)?;

    let channel = Channel::find_by_id(channel_id, db()).await?;
    channel.delete(db()).await?;
    emit_event(
        "channels.onDelete",
        &channel,
        &format!("space:{}", channel.space_id),
    )
    .await?;
    Ok(().into())
}

async fn list_unread(Path(_space_id): Path<Uuid>) -> Result<Json<Vec<ChannelUnread>>, Error> {
    // no-op for now
    Ok(vec![].into())
}

async fn acknowledge(Path((_, _channel_id)): Path<(Uuid, Uuid)>) -> Result<Json<()>, Error> {
    // no-op for now
    // TODO: Implement
    Ok(().into())
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
            "/:channelId",
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
            "/:channelId",
            patch_with(update, |o| {
                o.tag(TAG).id("channels.update").summary("Update Channel")
            }),
        )
        .route(
            "/:channelId",
            delete_with(delete, |o| {
                o.id("channels.delete").tag(TAG).summary("Delete Channel")
            }),
        )
        .route(
            "/unreads",
            get_with(list_unread, |o| {
                o.id("channels.unreads").tag(TAG).summary("List Unreads")
            }),
        )
        .route(
            "/:channelId/ack",
            post_with(acknowledge, |o| {
                o.id("channels.acknowledge")
                    .tag(TAG)
                    .summary("Acknowledge Channel")
            }),
        )
        .ws_event(
            "onCreate",
            |channel: Channel, _| async move { Some(channel) },
        )
        .ws_event(
            "onUpdate",
            |channel: Channel, _| async move { Some(channel) },
        )
        .ws_event(
            "onDelete",
            |channel: Channel, _| async move { Some(channel) },
        )
}
