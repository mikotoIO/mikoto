use axum::{
    extract::{ws, WebSocketUpgrade},
    routing::{get, MethodRouter},
};
use fred::prelude::{ClientLike, EventInterface, PubsubInterface};
use futures_util::{stream::StreamExt, SinkExt};
use schema::WebSocketRouter;
use state::WebsocketState;
use tokio::task::JoinHandle;

use crate::{db::redis, error::Error};

pub mod schema;
pub mod state;

#[derive(Serialize, Deserialize)]
pub struct Operation {
    pub op: String,
    pub data: serde_json::Value,
}

async fn handle_socket(
    socket: ws::WebSocket,
    router: &'static WebSocketRouter<()>,
) -> Result<(), Error> {
    let state = WebsocketState::new();

    let (mut writer, mut reader) = socket.split();

    let redis = redis().clone_new();
    redis.init().await?;
    redis.subscribe(vec![state.conn_id.to_string()]).await?;

    let mut server_to_client: JoinHandle<Result<(), Error>> = tokio::spawn(async move {
        while let Ok(msg) = redis.message_rx().recv().await {
            let msg = if let Some(x) = msg.value.as_string() {
                x
            } else {
                continue; // not a string message
            };
            let msg: Operation = serde_json::from_str(&msg)?;
            let filter = router.event_filters.get(&msg.op).unwrap();
            if let Some(data) = filter(msg.data, ())? {
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

            dbg!(msg.clone());
        }
    });

    tokio::select! {
        _ = (&mut server_to_client) => client_to_server.abort(),
        _ = (&mut client_to_server) => server_to_client.abort(),
    };
    Ok(())
}

pub fn handler(router: WebSocketRouter<()>) -> MethodRouter<()> {
    let router: &'static WebSocketRouter<()> = Box::leak(Box::new(router));

    get(move |upgrade: WebSocketUpgrade| async move {
        upgrade.on_upgrade(move |socket| async move {
            let _ = handle_socket(socket, router).await;
        })
    })
}
