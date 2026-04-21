use std::{
    collections::{HashMap, HashSet},
    sync::{
        atomic::{AtomicU64, Ordering},
        Arc, Mutex, OnceLock, Weak,
    },
    time::{Duration, Instant},
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

    // Bootstrap iff the doc is empty AND no other caller has an outstanding,
    // unexpired claim. The doc-emptiness check handles "already populated by
    // someone else"; the claim TTL handles the race where two clients hit a
    // cold room in the same tick (without a claim, both would see empty and
    // both bootstrap, duplicating content). The TTL self-heals the old
    // stuck-flag bug: a claimer that disconnects before producing content
    // releases the slot after CLAIM_TTL, so the next caller can re-claim.
    let room = get_or_create_room(channel_id);
    let should_bootstrap = {
        let awareness = room.awareness.read().await;
        let is_empty = awareness.doc().transact().state_vector().is_empty();
        drop(awareness);
        if !is_empty {
            false
        } else {
            let mut claim = room.claim.lock().unwrap_or_else(|e| e.into_inner());
            let now = Instant::now();
            match *claim {
                Some(expires) if expires > now => false,
                _ => {
                    *claim = Some(now + CLAIM_TTL);
                    true
                }
            }
        }
    };

    // Hold the room alive briefly so the client has time to open the WS
    // after getting this response. Applies regardless of `should_bootstrap`:
    // a non-bootstrapping caller still needs the room to stay populated
    // until their WS arrives to sync from it.
    let room_clone = room.clone();
    tokio::spawn(async move {
        tokio::time::sleep(CLAIM_TTL).await;
        let _ = room_clone;
    });

    Ok(Json(ClaimBootstrapResponse { should_bootstrap }))
}

const CLAIM_TTL: Duration = Duration::from_secs(30);

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
    channel_id: Uuid,
    awareness: RwLock<Awareness>,
    tx: broadcast::Sender<(u64, Arc<Vec<u8>>)>,
    // Bootstrap claim: `Some(expires_at)` when a caller of claim-bootstrap
    // has been given the right to populate the empty doc. Cleared implicitly
    // by the emptiness check in claim_bootstrap once content arrives, and
    // expired by TTL if the claimer never produces content.
    claim: Mutex<Option<Instant>>,
}

impl Drop for Room {
    fn drop(&mut self) {
        // Proactively remove our slot from the map when the last Arc goes
        // away. Guard against the race where get_or_create_room has already
        // replaced this dead Weak with a fresh Room: only remove if the
        // Weak still in the map fails to upgrade (i.e. it's ours).
        let mut map = rooms().lock().unwrap_or_else(|e| e.into_inner());
        if let Some(weak) = map.get(&self.channel_id) {
            if weak.strong_count() == 0 {
                map.remove(&self.channel_id);
            }
        }
    }
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
        channel_id,
        awareness: RwLock::new(Awareness::new(Doc::new())),
        tx,
        claim: Mutex::new(None),
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
                    // Lagged = this peer's receiver fell behind the broadcast
                    // buffer and missed updates. Silently continuing would
                    // leave them permanently out of sync. Drop the socket so
                    // the client reconnects and resyncs from scratch.
                    Err(broadcast::error::RecvError::Lagged(_)) => break,
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
