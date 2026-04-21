use std::sync::OnceLock;

use axum::{
    extract::{
        ws::{Message, WebSocket},
        Path, Query, WebSocketUpgrade,
    },
    response::Response,
    routing::get,
    Router,
};
use futures_util::{SinkExt, StreamExt};
use serde::Deserialize;
use tokio::sync::mpsc;
use uuid::Uuid;

use crate::{
    db::db,
    entities::{Channel, MemberKey, SpaceUser},
    error::Error,
    functions::jwt::{jwt_key, Claims},
};

use self::{protocol::process_payload, registry::SessionRegistry};

pub mod protocol;
pub mod registry;
pub mod session;

fn registry() -> &'static SessionRegistry {
    static REGISTRY: OnceLock<SessionRegistry> = OnceLock::new();
    REGISTRY.get_or_init(SessionRegistry::new)
}

#[derive(Deserialize)]
struct CollabParams {
    token: String,
}

pub fn router() -> Router<()> {
    Router::<()>::new().route("/ws/documents/:channelId", get(handler))
}

async fn handler(
    Path(channel_id): Path<Uuid>,
    Query(params): Query<CollabParams>,
    ws: WebSocketUpgrade,
) -> Result<Response, Error> {
    let claims = Claims::decode(&params.token, jwt_key())?;
    let user_id: Uuid = claims.sub.parse()?;

    let channel = Channel::find_by_id(channel_id, db()).await?;
    let space_id = channel.space_id.ok_or(Error::NotFound)?;
    SpaceUser::get_by_key(&MemberKey::new(space_id, user_id), db())
        .await
        .map_err(|_| Error::unauthorized("You are not a member of this space"))?;

    Ok(ws.on_upgrade(move |socket| peer(channel_id, socket)))
}

async fn peer(channel_id: Uuid, socket: WebSocket) {
    let (session, mut broadcast_rx) = match registry().join(channel_id).await {
        Ok(ok) => ok,
        Err(err) => {
            log::warn!(
                "collab: failed to open session for channel {}: {:?}",
                channel_id,
                err
            );
            return;
        }
    };

    let (mut writer, mut reader) = socket.split();

    // Direct replies (SyncStep2, AwarenessQuery responses) flow through this
    // mpsc — visible only to the requesting client, not broadcast.
    let (direct_tx, mut direct_rx) = mpsc::unbounded_channel::<Vec<u8>>();

    // Seed the client with the server's current state so it can fast-forward.
    let initial = {
        let guard = session.awareness.read().await;
        protocol::initial_sync(&guard)
    };
    match initial {
        Ok(bytes) => {
            if writer.send(Message::Binary(bytes)).await.is_err() {
                registry().leave(channel_id).await;
                return;
            }
        }
        Err(err) => {
            log::debug!("collab: initial sync encode failed: {:?}", err);
            registry().leave(channel_id).await;
            return;
        }
    }

    let session_in = session.clone();
    let broadcast_in = session.broadcast.clone();
    let mut inbound: tokio::task::JoinHandle<()> = tokio::spawn(async move {
        while let Some(msg) = reader.next().await {
            let bytes = match msg {
                Ok(Message::Binary(b)) => b,
                Ok(Message::Close(_)) | Err(_) => return,
                Ok(_) => continue,
            };
            let result = {
                let mut guard = session_in.awareness.write().await;
                process_payload(&mut guard, &bytes)
            };
            let result = match result {
                Ok(r) => r,
                Err(err) => {
                    log::debug!("collab: bad payload: {:?}", err);
                    continue;
                }
            };
            for reply in result.replies {
                if direct_tx.send(reply).is_err() {
                    return;
                }
            }
            for awareness in result.awareness_broadcast {
                let _ = broadcast_in.send(awareness);
            }
        }
    });

    let mut outbound: tokio::task::JoinHandle<()> = tokio::spawn(async move {
        loop {
            let payload = tokio::select! {
                msg = direct_rx.recv() => match msg {
                    Some(b) => b,
                    None => return,
                },
                msg = broadcast_rx.recv() => match msg {
                    Ok(b) => b,
                    Err(_) => return,
                },
            };
            if writer.send(Message::Binary(payload)).await.is_err() {
                return;
            }
        }
    });

    tokio::select! {
        _ = (&mut inbound) => outbound.abort(),
        _ = (&mut outbound) => inbound.abort(),
    }

    registry().leave(channel_id).await;
}
