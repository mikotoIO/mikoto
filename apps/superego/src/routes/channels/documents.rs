use std::{
    collections::HashMap,
    sync::{Arc, Weak},
};

use futures_util::StreamExt;
use tokio::sync::{Mutex, RwLock};

use aide::axum::routing::{get_with, patch_with};
use axum::{
    extract::{ws::WebSocket, Path, Query, WebSocketUpgrade},
    response::Response,
    Extension, Json, Router,
};
use uuid::Uuid;
use yrs::{sync::Awareness, Doc};
use yrs_axum::{
    broadcast::BroadcastGroup,
    ws::{AxumSink, AxumStream},
    AwarenessRef,
};

use crate::{
    db::db,
    entities::{Channel, Document, DocumentPatch, MemberExt, MemberKey, SpaceExt, SpaceUser},
    error::Error,
    functions::jwt::{jwt_key, Claims},
    middlewares::load::Load,
    routes::{router::AppRouter, ws::state::State},
};

async fn get(
    _claim: Claims,
    _member: Load<MemberExt>,
    Load(space): Load<SpaceExt>,
    Path((_, channel_id)): Path<(Uuid, Uuid)>,
) -> Result<Json<Document>, Error> {
    let channel = Channel::find_by_id(channel_id, db()).await?;
    if channel.space_id != space.base.id {
        return Err(Error::NotFound);
    }
    let document = Document::get_by_channel_id(channel_id, db()).await?;
    Ok(document.into())
}

async fn update(
    _claim: Claims,
    _member: Load<MemberExt>,
    Load(space): Load<SpaceExt>,
    Path((_, channel_id)): Path<(Uuid, Uuid)>,
    Json(patch): Json<DocumentPatch>,
) -> Result<Json<Document>, Error> {
    let channel = Channel::find_by_id(channel_id, db()).await?;
    if channel.space_id != space.base.id {
        return Err(Error::NotFound);
    }
    let document = Document::get_by_channel_id(channel_id, db()).await?;
    let document = document.update(patch, db()).await?;
    Ok(document.into())
}

static TAG: &str = "Documents";

pub fn router() -> AppRouter<State> {
    AppRouter::new()
        .route(
            "/",
            get_with(get, |o| {
                o.tag(TAG).id("documents.get").summary("Get Document")
            }),
        )
        .route(
            "/",
            patch_with(update, |o| {
                o.tag(TAG).id("documents.update").summary("Update Document")
            }),
        )
}

type BroadcastMap = Arc<Mutex<HashMap<String, Weak<BroadcastGroup>>>>;

#[derive(Deserialize)]
struct CollabParams {
    token: Option<String>,
}

pub fn collab_ws() -> Router<()> {
    let bcg_map: BroadcastMap = Arc::new(Mutex::new(HashMap::new()));

    Router::<()>::new()
        .route("/:room", axum::routing::get(ws_handler))
        .layer(Extension(bcg_map))
}

async fn ws_handler(
    Path(room): Path<String>,
    Query(params): Query<CollabParams>,
    ws: WebSocketUpgrade,
    Extension(bcast): Extension<BroadcastMap>,
) -> Result<Response, Error> {
    // Authenticate the WebSocket connection
    let token = params
        .token
        .ok_or(Error::unauthorized("Token not provided"))?;
    let claims = Claims::decode(&token, jwt_key())?;
    let user_id: Uuid = claims.sub.parse()?;

    // The room format is the channel ID; verify the user is a member of the channel's space
    let channel_id: Uuid = room.parse().map_err(|_| Error::NotFound)?;
    let channel = Channel::find_by_id(channel_id, db()).await?;
    SpaceUser::get_by_key(&MemberKey::new(channel.space_id, user_id), db())
        .await
        .map_err(|_| Error::unauthorized("You are not a member of this space"))?;

    Ok(ws.on_upgrade(move |socket| peer(room, socket, bcast)))
}

async fn peer(room: String, ws: WebSocket, bcg_map: BroadcastMap) {
    let mut bcg_map = bcg_map.lock().await;
    let bcast = match bcg_map.get(&room).and_then(|bc| bc.upgrade()) {
        Some(bcast) => bcast,
        None => {
            let awareness: AwarenessRef = Arc::new(RwLock::new(Awareness::new(Doc::new())));
            let bcast = Arc::new(BroadcastGroup::new(awareness.clone(), 32).await);
            bcg_map.insert(room, Arc::downgrade(&bcast));
            bcast
        }
    };

    let (sink, stream) = ws.split();
    let sink = Arc::new(Mutex::new(AxumSink::from(sink)));
    let stream = AxumStream::from(stream);
    let sub = bcast.subscribe(sink, stream);
    if (sub.completed().await).is_ok() {}
}
