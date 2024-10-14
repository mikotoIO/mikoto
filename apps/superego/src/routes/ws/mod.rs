use std::sync::Arc;

use axum::{
    extract::{
        ws::{self, Message, WebSocket},
        Query, WebSocketUpgrade,
    },
    routing::{get, MethodRouter},
};
use fred::prelude::{ClientLike, EventInterface, PubsubInterface};
use futures_util::{
    stream::{SplitSink, StreamExt},
    SinkExt,
};
use schema::WebSocketRouter;
use serde::{de::DeserializeOwned, Serialize};
use tokio::{sync::RwLock, task::JoinHandle};

use crate::{db::redis, error::Error};

pub mod schema;
pub mod state;

#[async_trait]
pub trait WebSocketState: Sized + Send + Sync + 'static {
    type Initial: DeserializeOwned + Send + Sync + 'static;

    async fn initialize(q: Self::Initial) -> Result<(Self, Vec<String>), Error>;
    fn clear_actions(&mut self) -> Vec<SocketAction>;
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Operation {
    pub op: String,
    pub data: serde_json::Value,
}

#[derive(Clone)]
pub enum SocketAction {
    Subscribe(Vec<String>),
    Unsubscribe(Vec<String>),
}

async fn ws_send<T: Serialize>(
    writer: &mut SplitSink<WebSocket, Message>,
    op: &str,
    data: T,
) -> Result<(), Error> {
    writer
        .send(
            serde_json::to_string(&Operation {
                op: op.to_string(),
                data: serde_json::to_value(data)?,
            })?
            .into(),
        )
        .await
        .map_err(|_| Error::WebSocketTerminated)?;
    Ok(())
}

async fn handle_socket<S: WebSocketState>(
    socket: ws::WebSocket,
    query: S::Initial,
    router: &'static WebSocketRouter<S>,
) -> Result<(), Error> {
    let (mut writer, mut reader) = socket.split();

    let (state, initial_subscriptions) = S::initialize(query).await?;

    let redis = {
        let redis = redis().clone_new();
        redis.init().await?;
        redis.subscribe(initial_subscriptions).await?;
        redis
    };

    let state = Arc::new(RwLock::new(state));
    let s2c_state = state.clone();
    let c2s_state = state.clone();

    ws_send(&mut writer, "ready", ()).await?;

    let mut server_to_client: JoinHandle<Result<(), Error>> = tokio::spawn(async move {
        let state = s2c_state;
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

            let res = filter(msg.data, state.clone()).await.map_err(|e| {
                warn!("Error handling event \"{}\": {}", msg.op, e);
                e
            })?;

            if let Some(data) = res {
                let actions = { state.write().await.clear_actions() };
                for action in actions {
                    match action {
                        SocketAction::Subscribe(channel) => {
                            redis.subscribe(channel).await?;
                        }
                        SocketAction::Unsubscribe(channel) => {
                            redis.unsubscribe(channel).await?;
                        }
                    }
                }
                ws_send(&mut writer, &msg.op, data).await?;
            }
        }
        Err(Error::WebSocketTerminated)
    });

    let mut client_to_server: JoinHandle<Result<(), Error>> = tokio::spawn(async move {
        let state = c2s_state;

        while let Some(msg) = reader.next().await {
            let msg = if let Ok(ws::Message::Text(msg)) = msg {
                msg
            } else {
                return Err(Error::WebSocketTerminated); // client disconnected
            };
            let msg: Operation = serde_json::from_str(&msg)?;
            let filter = if let Some(filter) = router.command_filters.get(&msg.op) {
                filter
            } else {
                continue; // no filter for this event
            };
            filter(msg.data, state.clone()).await?;
        }

        Err(Error::WebSocketTerminated)
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
