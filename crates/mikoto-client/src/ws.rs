use crate::error::ClientError;
use crate::generated::{WsCommand, WsEvent};
use futures_util::{SinkExt, StreamExt};
use tokio_tungstenite::tungstenite::Message;

pub struct WsConnection {
    write: futures_util::stream::SplitSink<
        tokio_tungstenite::WebSocketStream<
            tokio_tungstenite::MaybeTlsStream<tokio::net::TcpStream>,
        >,
        Message,
    >,
    read: futures_util::stream::SplitStream<
        tokio_tungstenite::WebSocketStream<
            tokio_tungstenite::MaybeTlsStream<tokio::net::TcpStream>,
        >,
    >,
}

#[derive(serde::Serialize)]
struct AuthMessage<'a> {
    op: &'a str,
    data: AuthData<'a>,
}

#[derive(serde::Serialize)]
struct AuthData<'a> {
    token: &'a str,
}

impl WsConnection {
    pub async fn connect(url: &str, token: &str) -> Result<Self, ClientError> {
        let (ws_stream, _) = tokio_tungstenite::connect_async(url).await?;
        let (write, read) = ws_stream.split();

        let mut conn = Self { write, read };

        // Send authentication message
        let auth = AuthMessage {
            op: "authenticate",
            data: AuthData { token },
        };
        let msg = serde_json::to_string(&auth)?;
        conn.write.send(Message::Text(msg.into())).await?;

        Ok(conn)
    }

    pub async fn send(&mut self, command: &WsCommand) -> Result<(), ClientError> {
        let msg = serde_json::to_string(command)?;
        self.write.send(Message::Text(msg.into())).await?;
        Ok(())
    }

    pub async fn recv(&mut self) -> Result<Option<WsEvent>, ClientError> {
        while let Some(msg) = self.read.next().await {
            let msg = msg?;
            match msg {
                Message::Text(text) => {
                    let event: WsEvent = serde_json::from_str(&text)?;
                    return Ok(Some(event));
                }
                Message::Close(_) => return Ok(None),
                _ => continue,
            }
        }
        Ok(None)
    }

    /// Receive the next raw text message from the WebSocket.
    ///
    /// Returns `Ok(None)` when the connection is closed. Unlike [`recv`],
    /// this does not attempt to deserialize the message, which is useful
    /// for frameworks that need to handle unknown event types gracefully.
    pub async fn recv_text(&mut self) -> Result<Option<String>, ClientError> {
        while let Some(msg) = self.read.next().await {
            let msg = msg?;
            match msg {
                Message::Text(text) => return Ok(Some(text.to_string())),
                Message::Close(_) => return Ok(None),
                _ => continue,
            }
        }
        Ok(None)
    }
}
