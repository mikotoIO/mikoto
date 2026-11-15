//! A WebSocket client for the realtime tests.

use std::time::Duration;

use futures_util::{SinkExt, StreamExt};
use serde_json::{json, Value};
use tokio::net::TcpStream;
use tokio_tungstenite::{tungstenite::Message, MaybeTlsStream, WebSocketStream};

use crate::{fixtures::TestUser, harness::TestApp};

pub struct Ws {
    stream: WebSocketStream<MaybeTlsStream<TcpStream>>,
}

const TIMEOUT: Duration = Duration::from_secs(5);

impl Ws {
    /// Open a socket and send the authentication message, without waiting.
    pub async fn open(app: &TestApp, token: &str) -> Self {
        let (stream, _) = tokio_tungstenite::connect_async(app.ws_url())
            .await
            .expect("websocket connect failed");
        let mut ws = Self { stream };
        ws.send("authenticate", json!({ "token": token })).await;
        ws
    }

    /// Open an authenticated socket and wait until the server is ready.
    pub async fn connect(app: &TestApp, user: &TestUser) -> Self {
        let mut ws = Self::open(app, &user.token).await;
        ws.expect("ready").await;
        ws
    }

    pub async fn send(&mut self, op: &str, data: Value) {
        let text = json!({ "op": op, "data": data }).to_string();
        self.stream.send(Message::Text(text)).await.unwrap();
    }

    /// The next message, or None if the socket closed or nothing arrived in
    /// `wait`.
    pub async fn next(&mut self, wait: Duration) -> Option<(String, Value)> {
        loop {
            let msg = tokio::time::timeout(wait, self.stream.next())
                .await
                .ok()??
                .ok()?;
            match msg {
                Message::Text(text) => {
                    let v: Value = serde_json::from_str(&text).unwrap();
                    return Some((v["op"].as_str().unwrap().to_string(), v["data"].clone()));
                }
                Message::Close(_) => return None,
                _ => continue,
            }
        }
    }

    /// Wait for an event, skipping unrelated ones. Panics on timeout.
    pub async fn expect(&mut self, op: &str) -> Value {
        let deadline = tokio::time::Instant::now() + TIMEOUT;
        loop {
            let remaining = deadline.saturating_duration_since(tokio::time::Instant::now());
            match self.next(remaining).await {
                Some((got, data)) if got == op => return data,
                Some(_) => continue,
                None => panic!("timed out or disconnected waiting for {op:?}"),
            }
        }
    }

    /// Assert no `op` event arrives within a short window.
    pub async fn expect_none(&mut self, op: &str) {
        let deadline = tokio::time::Instant::now() + Duration::from_millis(500);
        loop {
            let remaining = deadline.saturating_duration_since(tokio::time::Instant::now());
            if remaining.is_zero() {
                return;
            }
            match self.next(remaining).await {
                Some((got, data)) if got == op => panic!("unexpected {op:?}: {data}"),
                Some(_) => continue,
                None => return,
            }
        }
    }

    /// True if the server closes the connection (or never says anything).
    pub async fn closes_without_ready(&mut self) -> bool {
        !matches!(self.next(TIMEOUT).await, Some((op, _)) if op == "ready")
    }
}
