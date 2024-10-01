use std::{
    collections::HashMap,
    sync::{Arc, Weak},
};

use futures_util::StreamExt;
use tokio::sync::{Mutex, RwLock};

use aide::axum::routing::{get_with, patch_with};
use axum::{
    extract::{ws::WebSocket, Path, WebSocketUpgrade},
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
    entities::{Document, DocumentPatch},
    error::Error,
    routes::{router::AppRouter, ws::state::State},
};

async fn get(Path((_, channel_id)): Path<(Uuid, Uuid)>) -> Result<Json<Document>, Error> {
    let document = Document::get_by_channel_id(channel_id, db()).await?;
    Ok(document.into())
}

async fn update(
    Path((_, channel_id)): Path<(Uuid, Uuid)>,
    Json(patch): Json<DocumentPatch>,
) -> Result<Json<Document>, Error> {
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

pub fn collab_ws() -> Router<()> {
    let bcg_map: BroadcastMap = Arc::new(Mutex::new(HashMap::new()));

    Router::<()>::new()
        .route("/:room", axum::routing::get(ws_handler))
        .layer(Extension(bcg_map))
}

async fn ws_handler(
    Path(room): Path<String>,
    ws: WebSocketUpgrade,
    Extension(bcast): Extension<BroadcastMap>,
) -> Response {
    ws.on_upgrade(move |socket| peer(room, socket, bcast))
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
    match sub.completed().await {
        Ok(_) => {}
        Err(_) => {}
    }
}
