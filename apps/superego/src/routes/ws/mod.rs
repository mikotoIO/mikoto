use axum::{
    extract::{ws, WebSocketUpgrade},
    response::Response,
};
use fred::prelude::{ClientLike, EventInterface, PubsubInterface};
use futures_util::{stream::StreamExt, SinkExt};
use state::WebsocketState;

use crate::{db::redis, error::Error};

pub mod state;

#[derive(Serialize, Deserialize)]
pub struct SimpleOperation {
    pub op: String,
}

async fn handle_socket_infallible(socket: ws::WebSocket) {
    let _ = handle_socket(socket).await;
}

async fn handle_socket(socket: ws::WebSocket) -> Result<(), Error> {
    let state = WebsocketState::new();

    let (mut writer, mut reader) = socket.split();

    let redis = redis().clone_new();
    redis.init().await?;
    redis.subscribe(vec![state.conn_id.to_string()]).await?;

    let mut server_to_client = tokio::spawn(async move {
        while let Ok(msg) = redis.message_rx().recv().await {
            dbg!(msg);
            if writer
                .send(ws::Message::Text("lol".to_string()))
                .await
                .is_err()
            {
                return;
            }
        }
    });

    let mut client_to_server = tokio::spawn(async move {
        while let Some(msg) = reader.next().await {
            let msg = if let Ok(ws::Message::Text(msg)) = msg {
                msg
            } else {
                // client disconnected
                return;
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

pub async fn handler(upgrade: WebSocketUpgrade) -> Response {
    upgrade.on_upgrade(handle_socket_infallible)
}
