use std::{
    collections::HashMap,
    sync::{
        atomic::{AtomicBool, Ordering},
        Arc, Weak,
    },
};

use aide::axum::routing::{get_with, patch_with};
use axum::{
    extract::{
        ws::{Message as WsMessage, WebSocket},
        Path, Query, WebSocketUpgrade,
    },
    response::Response,
    Extension, Json, Router,
};
use futures_util::{SinkExt, StreamExt};
use tokio::{
    sync::{broadcast, mpsc, Mutex, RwLock},
    task::JoinHandle,
};
use uuid::Uuid;
use yrs::{
    encoding::write::Write as _,
    sync::{
        protocol::{MSG_SYNC, MSG_SYNC_UPDATE},
        Awareness, DefaultProtocol, Message, Protocol, SyncMessage,
    },
    updates::{
        decoder::Decode,
        encoder::{Encode, Encoder, EncoderV1},
    },
    Doc, ReadTxn, Subscription, Transact, Update,
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

// A long-lived `Room` holds the shared Y.Doc state for a single channel's
// collaborative session. It lives as long as at least one peer is connected;
// `RoomMap` stores `Weak` references so rooms drop automatically when empty.
//
// Y.Doc state is purely ephemeral: the canonical document is the markdown
// persisted in Postgres. Clients bootstrap the doc from markdown on join and
// save markdown back via the existing REST endpoint.

const BROADCAST_CAPACITY: usize = 1024;

// Custom y-sync-style message tag the server uses to tell exactly one peer
// that it has been elected to seed the shared Y.Doc from the canonical
// Postgres markdown. The client registers a handler on this tag via
// `provider.messageHandlers[MSG_BOOTSTRAP_ELECT]`. Tags 0-3 are reserved by
// the y-sync protocol; 10 is well clear of that range.
const MSG_BOOTSTRAP_ELECT: u8 = 10;

type RoomMap = Arc<Mutex<HashMap<String, Weak<Room>>>>;
type AwarenessRef = Arc<RwLock<Awareness>>;

struct Room {
    awareness: AwarenessRef,
    sender: broadcast::Sender<Vec<u8>>,
    // Exactly one peer wins this `compare_exchange` per Room lifetime and is
    // told to seed the shared Y.Doc from Postgres. Without this election,
    // two peers connecting to a freshly-created room both see
    // `root._xmlText._length === 0` client-side, both run
    // `$convertFromMarkdownString`, and Yjs merges two independent bootstrap
    // states — producing duplicated content and a transient "clear" during
    // the merge.
    bootstrap_claimed: AtomicBool,
    _doc_sub: Subscription,
    _awareness_sub: Subscription,
    _awareness_updater: JoinHandle<()>,
}

impl Room {
    async fn new() -> Arc<Self> {
        let awareness: AwarenessRef = Arc::new(RwLock::new(Awareness::new(Doc::new())));
        let (sender, _) = broadcast::channel::<Vec<u8>>(BROADCAST_CAPACITY);

        let mut lock = awareness.write().await;

        let doc_sub = {
            let sink = sender.clone();
            lock.doc_mut()
                .observe_update_v1(move |_txn, u| {
                    let mut encoder = EncoderV1::new();
                    encoder.write_var(MSG_SYNC);
                    encoder.write_var(MSG_SYNC_UPDATE);
                    encoder.write_buf(&u.update);
                    let _ = sink.send(encoder.to_vec());
                })
                .expect("observe_update_v1")
        };

        let (tx, mut rx) = mpsc::unbounded_channel::<Vec<yrs::block::ClientID>>();
        let awareness_sub = lock.on_update(move |e| {
            let added = e.added();
            let updated = e.updated();
            let removed = e.removed();
            let mut changed = Vec::with_capacity(added.len() + updated.len() + removed.len());
            changed.extend_from_slice(added);
            changed.extend_from_slice(updated);
            changed.extend_from_slice(removed);
            let _ = tx.send(changed);
        });
        drop(lock);

        let awareness_weak = Arc::downgrade(&awareness);
        let sink = sender.clone();
        let awareness_updater = tokio::spawn(async move {
            while let Some(clients) = rx.recv().await {
                let Some(aw) = awareness_weak.upgrade() else {
                    break;
                };
                let aw = aw.read().await;
                if let Ok(update) = aw.update_with_clients(clients) {
                    let _ = sink.send(Message::Awareness(update).encode_v1());
                }
            }
        });

        Arc::new(Self {
            awareness,
            sender,
            bootstrap_claimed: AtomicBool::new(false),
            _doc_sub: doc_sub,
            _awareness_sub: awareness_sub,
            _awareness_updater: awareness_updater,
        })
    }
}

impl Drop for Room {
    fn drop(&mut self) {
        self._awareness_updater.abort();
    }
}

async fn handle_msg(
    awareness: &AwarenessRef,
    msg: Message,
) -> Result<Option<Message>, yrs::sync::Error> {
    let protocol = DefaultProtocol;
    match msg {
        Message::Sync(sync) => match sync {
            SyncMessage::SyncStep1(sv) => {
                let aw = awareness.read().await;
                protocol.handle_sync_step1(&aw, sv)
            }
            SyncMessage::SyncStep2(update) => {
                let mut aw = awareness.write().await;
                let update = Update::decode_v1(&update)?;
                protocol.handle_sync_step2(&mut aw, update)
            }
            SyncMessage::Update(update) => {
                let mut aw = awareness.write().await;
                let update = Update::decode_v1(&update)?;
                protocol.handle_sync_step2(&mut aw, update)
            }
        },
        Message::Auth(reason) => {
            let aw = awareness.read().await;
            protocol.handle_auth(&aw, reason)
        }
        Message::AwarenessQuery => {
            let aw = awareness.read().await;
            protocol.handle_awareness_query(&aw)
        }
        Message::Awareness(update) => {
            let mut aw = awareness.write().await;
            protocol.handle_awareness_update(&mut aw, update)
        }
        Message::Custom(tag, data) => {
            let mut aw = awareness.write().await;
            protocol.missing_handle(&mut aw, tag, data)
        }
    }
}

#[derive(Deserialize)]
struct CollabParams {
    token: Option<String>,
}

pub fn collab_ws() -> Router<()> {
    let rooms: RoomMap = Arc::new(Mutex::new(HashMap::new()));

    Router::<()>::new()
        .route("/:room", axum::routing::get(ws_handler))
        .layer(Extension(rooms))
}

async fn ws_handler(
    Path(room): Path<String>,
    Query(params): Query<CollabParams>,
    ws: WebSocketUpgrade,
    Extension(rooms): Extension<RoomMap>,
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

    Ok(ws.on_upgrade(move |socket| peer(room, socket, rooms)))
}

async fn peer(room_id: String, ws: WebSocket, rooms: RoomMap) {
    let room = {
        let mut rooms = rooms.lock().await;
        match rooms.get(&room_id).and_then(Weak::upgrade) {
            Some(r) => r,
            None => {
                let r = Room::new().await;
                rooms.insert(room_id, Arc::downgrade(&r));
                r
            }
        }
    };

    let (mut sink, mut stream) = ws.split();
    let mut bcast_rx = room.sender.subscribe();
    let (reply_tx, mut reply_rx) = mpsc::unbounded_channel::<Vec<u8>>();

    // Per the y-sync protocol, the server must proactively send its own
    // SyncStep1 (state vector) + current Awareness state to a new peer. This
    // prompts the client to reply with SyncStep2 containing updates the server
    // is missing, and tells the client about other connected peers' presence.
    // Without this, a client that holds state not yet on the server (e.g. a
    // reconnect after a Room was garbage-collected) never transmits it, and
    // late joiners never see initial awareness until someone moves their
    // cursor.
    {
        let awareness = room.awareness.read().await;
        let mut encoder = EncoderV1::new();
        if DefaultProtocol.start(&awareness, &mut encoder).is_ok() {
            let _ = reply_tx.send(encoder.to_vec());
        }
    }

    // Atomically elect a bootstrapper. The winner of this compare_exchange is
    // the ONLY peer that should seed the Y.Doc from Postgres markdown. Every
    // other peer must wait for the seed to arrive over the sync protocol.
    // This eliminates the "both peers bootstrap, content duplicates" race.
    let elected = room
        .bootstrap_claimed
        .compare_exchange(false, true, Ordering::AcqRel, Ordering::Acquire)
        .is_ok();
    if elected {
        let mut encoder = EncoderV1::new();
        encoder.write_var(MSG_BOOTSTRAP_ELECT);
        let _ = reply_tx.send(encoder.to_vec());
    }

    // Writer task: pipes messages from two sources (broadcast + this peer's
    // direct replies) into the websocket sink.
    //
    // If the broadcast receiver lags past the channel capacity, we MUST NOT
    // silently skip messages — Yjs peers need every update to keep their
    // local state in sync. Instead we break out of the loop, which closes the
    // socket and forces the client to reconnect + re-run SyncStep1/2 against
    // the server's current state.
    let writer = tokio::spawn(async move {
        loop {
            let msg = tokio::select! {
                bcast = bcast_rx.recv() => match bcast {
                    Ok(m) => m,
                    Err(broadcast::error::RecvError::Closed) => break,
                    Err(broadcast::error::RecvError::Lagged(_)) => break,
                },
                reply = reply_rx.recv() => match reply {
                    Some(m) => m,
                    None => break,
                },
            };
            if sink.send(WsMessage::Binary(msg)).await.is_err() {
                break;
            }
        }
    });

    // Reader loop: decode incoming y-sync messages and apply them.
    while let Some(Ok(ws_msg)) = stream.next().await {
        let bytes = match ws_msg {
            WsMessage::Binary(b) => b,
            WsMessage::Close(_) => break,
            _ => continue,
        };
        let msg = match Message::decode_v1(&bytes) {
            Ok(m) => m,
            Err(_) => continue,
        };
        match handle_msg(&room.awareness, msg).await {
            Ok(Some(reply)) => {
                if reply_tx.send(reply.encode_v1()).is_err() {
                    break;
                }
            }
            Ok(None) => {}
            Err(_) => break,
        }
    }

    drop(reply_tx);
    writer.abort();

    // If the elected peer disconnected before actually seeding the Y.Doc,
    // release the claim so another connected peer can take over. Without
    // this, a dropped elected peer would leave the remaining peers waiting
    // on an empty doc forever.
    if elected {
        let awareness = room.awareness.read().await;
        let is_empty = awareness.doc().transact().state_vector().is_empty();
        drop(awareness);
        if is_empty {
            room.bootstrap_claimed.store(false, Ordering::Release);
        }
    }
}
