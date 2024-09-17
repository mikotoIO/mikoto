use aide::axum::routing::{delete_with, get_with, patch_with, post_with};
use axum::{extract::Path, Json};
use schemars::JsonSchema;
use uuid::Uuid;

use crate::{
    db::db,
    entities::{Channel, ChannelPatch, ChannelType, ObjectWithId},
    error::Error,
    functions::pubsub::emit_event,
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
    Json(body): Json<ChannelCreatePayload>,
) -> Result<Json<Channel>, Error> {
    let channel = Channel {
        id: Uuid::new_v4(),
        space_id,
        name: body.name,
        parent_id: body.parent_id,
        category: body.kind.unwrap_or(ChannelType::Text),
        order: 0,
        last_updated: Some(chrono::Utc::now().naive_utc()),
    };
    channel.create(db()).await?;
    emit_event(
        "channels.onCreate",
        &channel,
        &format!("spaces:{}", space_id),
    )
    .await?;

    Ok(channel.into())
}

async fn update(
    Path((_, channel_id)): Path<(Uuid, Uuid)>,
    Json(patch): Json<ChannelPatch>,
) -> Result<Json<Channel>, Error> {
    let channel = Channel::find_by_id(channel_id, db()).await?;
    let channel = channel.update(patch, db()).await?;
    emit_event(
        "channels.onUpdate",
        &channel,
        &format!("spaces:{}", channel.space_id),
    )
    .await?;
    Ok(channel.into())
}

async fn delete(Path((_, channel_id)): Path<(Uuid, Uuid)>) -> Result<Json<()>, Error> {
    let channel = Channel::find_by_id(channel_id, db()).await?;
    channel.delete(db()).await?;
    emit_event(
        "channels.onDelete",
        &ObjectWithId::from_id(channel_id),
        &format!("spaces:{}", channel.space_id),
    )
    .await?;
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
        .ws_event(
            "onCreate",
            |channel: Channel, _| async move { Some(channel) },
        )
        .ws_event(
            "onUpdate",
            |channel: Channel, _| async move { Some(channel) },
        )
        .ws_event("onDelete", |channel: ObjectWithId, _| async move {
            Some(channel)
        })
}
