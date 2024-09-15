use std::sync::Arc;

use axum::{
    extract::{ws, Query, WebSocketUpgrade},
    routing::{get, MethodRouter},
};
use fred::prelude::{ClientLike, EventInterface, PubsubInterface};
use futures_util::{stream::StreamExt, SinkExt};
use schema::WebSocketRouter;
use serde::de::DeserializeOwned;
use tokio::{sync::RwLock, task::JoinHandle};
use uuid::Uuid;

use crate::{db::redis, entities::ObjectWithId, error::Error, functions::pubsub::emit_event};

pub mod schema;
pub mod state;

#[async_trait]
pub trait WebSocketState: Send + Sync + 'static {
    type Initial: DeserializeOwned + Send + Sync + 'static;

    fn new() -> Self;
    async fn initialize(&mut self, q: Self::Initial) -> Option<Vec<String>>;
}

#[derive(Serialize, Deserialize)]
pub struct Operation {
    pub op: String,
    pub data: serde_json::Value,
}

async fn handle_socket<S: WebSocketState>(
    socket: ws::WebSocket,
    query: S::Initial,
    router: &'static WebSocketRouter<S>,
) -> Result<(), Error> {
    let mut state = S::new();

    let (mut writer, mut reader) = socket.split();

    let initial_subscriptions = state
        .initialize(query)
        .await
        .ok_or(Error::WebSocketTerminated)?;

    let redis = {
        let redis = redis().clone_new();
        redis.init().await?;
        redis.subscribe(initial_subscriptions).await?;
        redis
    };

    let state = Arc::new(RwLock::new(state));

    let mut server_to_client: JoinHandle<Result<(), Error>> = tokio::spawn(async move {
        while let Ok(msg) = redis.message_rx().recv().await {
            let msg = if let Some(x) = msg.value.as_string() {
                x
            } else {
                continue; // not a string message
            };
            let msg: Operation = serde_json::from_str(&msg)?;
            let filter = if let Some(filter) = router.event_filters.get(&msg.op) {
                filter
            } else {
                continue; // no filter for this event
            };
            if let Some(data) = filter(msg.data, state.clone())? {
                writer
                    .send(serde_json::to_string(&Operation { op: msg.op, data })?.into())
                    .await
                    .map_err(|_| Error::WebSocketTerminated)?;
            }
        }
        Err(Error::WebSocketTerminated)
    });

    let mut client_to_server = tokio::spawn(async move {
        while let Some(msg) = reader.next().await {
            let msg = if let Ok(ws::Message::Text(msg)) = msg {
                msg
            } else {
                return; // client disconnected
            };
            emit_event(
                "spaces.onDelete",
                ObjectWithId { id: Uuid::new_v4() },
                "all",
            )
            .await
            .unwrap();
            dbg!(msg.clone());
        }
    });

    tokio::select! {
        _ = (&mut server_to_client) => client_to_server.abort(),
        _ = (&mut client_to_server) => server_to_client.abort(),
    };
    Ok(())
}

pub fn handler<S: WebSocketState>(router: WebSocketRouter<S>) -> MethodRouter<()> {
    let router: &'static WebSocketRouter<S> = Box::leak(Box::new(router));

    get(
        move |Query(q): Query<S::Initial>, upgrade: WebSocketUpgrade| async move {
            upgrade.on_upgrade(move |socket| async move {
                let _ = handle_socket::<S>(socket, q, router).await;
            })
        },
    )
}
