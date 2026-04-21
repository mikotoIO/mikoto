use std::{
    collections::{HashMap, HashSet},
    sync::{
        atomic::{AtomicU64, Ordering},
        Arc, OnceLock, Weak,
    },
    time::Duration,
};

use aide::axum::routing::{get_with, patch_with, post_with};
use axum::{
    extract::{
        ws::{Message as WsMessage, WebSocket},
        Path, Query, WebSocketUpgrade,
    },
    response::Response,
    Json, Router,
};
use futures_util::{SinkExt, StreamExt};
use schemars::JsonSchema;
use tokio::sync::{broadcast, mpsc, RwLock};
use uuid::Uuid;
use yrs::{
    encoding::read::Cursor,
    sync::{
        Awareness, AwarenessUpdate, DefaultProtocol, Message as YMessage, MessageReader, Protocol,
        SyncMessage,
    },
    updates::{
        decoder::{Decode, DecoderV1},
        encoder::{Encode, Encoder, EncoderV1},
    },
    Doc, ReadTxn, Transact, Update,
};

use crate::{
    db::db,
    entities::{
        Channel, Document, DocumentPatch, MemberExt, MemberKey, Relationship, SpaceExt, SpaceUser,
    },
    error::Error,
    functions::{
        jwt::{jwt_key, Claims},
        time::Timestamp,
    },
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
    if channel.space_id != Some(space.base.id) {
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
    if channel.space_id != Some(space.base.id) {
        return Err(Error::NotFound);
    }
    let document = Document::get_by_channel_id(channel_id, db()).await?;
    let document = document.update(patch, db()).await?;
    Channel::update_last_updated(channel_id, Timestamp::now(), db()).await?;
    Ok(document.into())
}

#[derive(Serialize, JsonSchema)]
#[serde(rename_all = "camelCase")]
struct ClaimBootstrapResponse {
    should_bootstrap: bool,
}

async fn claim_bootstrap(
    _claim: Claims,
    _member: Load<MemberExt>,
    Load(space): Load<SpaceExt>,
    Path((_, channel_id)): Path<(Uuid, Uuid)>,
) -> Result<Json<ClaimBootstrapResponse>, Error> {
    let channel = Channel::find_by_id(channel_id, db()).await?;
    if channel.space_id != Some(space.base.id) {
        return Err(Error::NotFound);
    }

    // Stateless decision: bootstrap is needed iff the server's Y.Doc is
    // currently empty. A stateful claim flag caused a hang when the first
    // claimer disconnected before their initial Update reached us — the flag
    // stayed set, so the next session saw shouldBootstrap=false *and* no
    // content to sync, leaving an empty editor. By deciding per-call based
    // on actual doc state, the client always gets shouldBootstrap=true until
    // someone has successfully populated the doc, and otherwise syncs from
    // the retained server state.
    //
    // Trade-off: two peers connecting to a cold room at the *same* instant
    // can both see doc-empty and both bootstrap, producing duplicate content.
    // For the single-user re-edit flow that's dominant here, that race
    // doesn't apply.
    let room = get_or_create_room(channel_id);
    let should_bootstrap = {
        let awareness = room.awareness.read().await;
        let is_empty = awareness.doc().transact().state_vector().is_empty();
        is_empty
    };

    // Hold the room alive briefly so the client has time to actually open
    // the WebSocket after getting this response.
    let room_clone = room.clone();
    tokio::spawn(async move {
        tokio::time::sleep(Duration::from_secs(30)).await;
        drop(room_clone);
    });

    Ok(Json(ClaimBootstrapResponse { should_bootstrap }))
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
        .route(
            "/claim-bootstrap",
            post_with(claim_bootstrap, |o| {
                o.tag(TAG)
                    .id("documents.claimBootstrap")
                    .summary("Claim Document Bootstrap")
            }),
        )
}

struct Room {
    awareness: RwLock<Awareness>,
    tx: broadcast::Sender<(u64, Arc<Vec<u8>>)>,
}

type RoomMap = std::sync::Mutex<HashMap<Uuid, Weak<Room>>>;

fn rooms() -> &'static RoomMap {
    static ROOMS: OnceLock<RoomMap> = OnceLock::new();
    ROOMS.get_or_init(|| std::sync::Mutex::new(HashMap::new()))
}

fn get_or_create_room(channel_id: Uuid) -> Arc<Room> {
    // Recover from a poisoned mutex by continuing with whatever state is there —
    // a panicking holder doesn't corrupt our HashMap.
    let mut map = rooms().lock().unwrap_or_else(|e| e.into_inner());
    if let Some(room) = map.get(&channel_id).and_then(|w| w.upgrade()) {
        return room;
    }
    let (tx, _) = broadcast::channel(256);
    let r = Arc::new(Room {
        awareness: RwLock::new(Awareness::new(Doc::new())),
        tx,
    });
    map.insert(channel_id, Arc::downgrade(&r));
    r
}

static CONN_SEQ: AtomicU64 = AtomicU64::new(0);

#[derive(Deserialize)]
struct CollabParams {
    token: Option<String>,
}

pub fn collab_ws() -> Router<()> {
    Router::<()>::new().route("/:room", axum::routing::get(ws_handler))
}

async fn ws_handler(
    Path(room): Path<String>,
    Query(params): Query<CollabParams>,
    ws: WebSocketUpgrade,
) -> Result<Response, Error> {
    let token = params
        .token
        .ok_or(Error::unauthorized("Token not provided"))?;
    let claims = Claims::decode(&token, jwt_key())?;
    let user_id: Uuid = claims.sub.parse()?;

    let channel_id: Uuid = room.parse().map_err(|_| Error::NotFound)?;
    let channel = Channel::find_by_id(channel_id, db()).await?;
    if let Some(space_id) = channel.space_id {
        SpaceUser::get_by_key(&MemberKey::new(space_id, user_id), db())
            .await
            .map_err(|_| Error::unauthorized("You are not a member of this space"))?;
    } else {
        Relationship::find_by_channel(channel_id, user_id, db())
            .await?
            .ok_or(Error::unauthorized(
                "You do not have access to this channel",
            ))?;
    }

    let room_arc = get_or_create_room(channel_id);
    Ok(ws.on_upgrade(move |socket| peer(socket, room_arc)))
}

fn encode_message(msg: &YMessage) -> Vec<u8> {
    let mut enc = EncoderV1::new();
    msg.encode(&mut enc);
    enc.to_vec()
}

async fn peer(ws: WebSocket, room: Arc<Room>) {
    let conn_id = CONN_SEQ.fetch_add(1, Ordering::Relaxed);
    let (mut sink, mut stream) = ws.split();
    let proto = DefaultProtocol;
    let mut owned_clients: HashSet<u64> = HashSet::new();

    // Send initial sync payload (SyncStep1 + Awareness) to the new peer.
    let initial = {
        let awareness = room.awareness.read().await;
        let mut encoder = EncoderV1::new();
        proto
            .start(&awareness, &mut encoder)
            .ok()
            .map(|_| encoder.to_vec())
    };
    if let Some(bytes) = initial {
        if sink.send(WsMessage::Binary(bytes)).await.is_err() {
            return;
        }
    }

    let (out_tx, mut out_rx) = mpsc::channel::<Vec<u8>>(128);
    let mut broadcast_rx = room.tx.subscribe();

    let write_task = tokio::spawn(async move {
        loop {
            tokio::select! {
                msg = out_rx.recv() => match msg {
                    Some(bytes) => {
                        if sink.send(WsMessage::Binary(bytes)).await.is_err() {
                            break;
                        }
                    }
                    None => break,
                },
                msg = broadcast_rx.recv() => match msg {
                    Ok((sender, bytes)) => {
                        if sender == conn_id { continue; }
                        if sink.send(WsMessage::Binary((*bytes).clone())).await.is_err() {
                            break;
                        }
                    }
                    Err(broadcast::error::RecvError::Closed) => break,
                    Err(broadcast::error::RecvError::Lagged(_)) => continue,
                },
            }
        }
    });

    while let Some(ws_msg) = stream.next().await {
        let data = match ws_msg {
            Ok(WsMessage::Binary(b)) => b,
            Ok(WsMessage::Close(_)) => break,
            Ok(_) => continue,
            Err(_) => break,
        };

        let mut decoder = DecoderV1::new(Cursor::new(&data));
        let mut reader = MessageReader::new(&mut decoder);

        while let Some(Ok(msg)) = reader.next() {
            match msg {
                YMessage::Sync(SyncMessage::SyncStep1(sv)) => {
                    let reply = {
                        let awareness = room.awareness.read().await;
                        proto.handle_sync_step1(&awareness, sv).ok().flatten()
                    };
                    if let Some(reply) = reply {
                        let _ = out_tx.send(encode_message(&reply)).await;
                    }
                }
                YMessage::Sync(SyncMessage::SyncStep2(bytes))
                | YMessage::Sync(SyncMessage::Update(bytes)) => {
                    let mut awareness = room.awareness.write().await;
                    if let Ok(update) = Update::decode_v1(&bytes) {
                        let _ = proto.handle_update(&mut awareness, update);
                    }
                    drop(awareness);
                    let rebroadcast = YMessage::Sync(SyncMessage::Update(bytes));
                    let encoded = Arc::new(encode_message(&rebroadcast));
                    let _ = room.tx.send((conn_id, encoded));
                }
                YMessage::Awareness(upd) => {
                    // Track which client IDs this connection is responsible
                    // for so we can clean them up when the socket drops
                    // without a graceful disconnect (tab closed, network
                    // loss). Without this, stale cursors from past sessions
                    // accumulate and peers — including the original user on
                    // a fresh Y.Doc — see them as remote cursors.
                    for client_id in upd.clients.keys() {
                        owned_clients.insert(*client_id);
                    }
                    let upd_bytes = upd.encode_v1();
                    let mut awareness = room.awareness.write().await;
                    let _ = awareness.apply_update(upd);
                    drop(awareness);
                    if let Ok(fresh) = AwarenessUpdate::decode_v1(&upd_bytes) {
                        let rebroadcast = YMessage::Awareness(fresh);
                        let encoded = Arc::new(encode_message(&rebroadcast));
                        let _ = room.tx.send((conn_id, encoded));
                    }
                }
                YMessage::AwarenessQuery => {
                    let reply = {
                        let awareness = room.awareness.read().await;
                        proto.handle_awareness_query(&awareness).ok().flatten()
                    };
                    if let Some(reply) = reply {
                        let _ = out_tx.send(encode_message(&reply)).await;
                    }
                }
                YMessage::Auth(_) | YMessage::Custom(_, _) => {}
            }
        }
    }

    if !owned_clients.is_empty() {
        let mut awareness = room.awareness.write().await;
        let to_remove: Vec<u64> = owned_clients
            .iter()
            .filter(|id| awareness.clients().contains_key(*id))
            .copied()
            .collect();
        for client_id in &to_remove {
            awareness.remove_state(*client_id);
        }
        let removal = awareness.update_with_clients(to_remove).ok();
        drop(awareness);
        if let Some(update) = removal {
            let msg = YMessage::Awareness(update);
            let encoded = Arc::new(encode_message(&msg));
            let _ = room.tx.send((conn_id, encoded));
        }
    }

    write_task.abort();
}
