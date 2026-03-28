use std::sync::Arc;

use uuid::Uuid;

use tokio::sync::mpsc;

use crate::cache::Cache;
use crate::client::MikotoClient;
use crate::error::ClientError;
use crate::generated::{HttpApi, MessageExt, MessageSendPayload, TypingStart, WsCommand};

/// A cheaply cloneable handle that provides access to the HTTP API and cache.
///
/// Every [`EventHandler`](crate::EventHandler) method receives a `Context`.
/// It can be freely cloned and moved into spawned tasks.
#[derive(Clone)]
pub struct Context {
    pub(crate) http: Arc<MikotoClient>,
    pub(crate) cache: Arc<Cache>,
    pub(crate) ws_tx: mpsc::UnboundedSender<WsCommand>,
}

impl Context {
    pub(crate) fn new(
        http: Arc<MikotoClient>,
        cache: Arc<Cache>,
        ws_tx: mpsc::UnboundedSender<WsCommand>,
    ) -> Self {
        Self { http, cache, ws_tx }
    }

    /// Access the full HTTP API (same as [`MikotoClient::api`]).
    pub fn api(&self) -> HttpApi<'_> {
        self.http.api()
    }

    /// Access the cache.
    pub fn cache(&self) -> &Cache {
        &self.cache
    }

    /// Send a `typing.start` command over the WebSocket.
    ///
    /// In the UI this shows "BotName is thinking..." for bot users.
    pub fn set_typing(&self, channel_id: Uuid) {
        let _ = self.ws_tx.send(WsCommand::TypingStart(TypingStart {
            channel_id: channel_id.to_string(),
        }));
    }

    /// Convenience: send a text message to a channel.
    ///
    /// Automatically resolves `space_id` from the cache so callers don't
    /// need to track the channel→space mapping themselves.
    pub async fn send_message(
        &self,
        channel_id: Uuid,
        content: impl Into<String>,
    ) -> Result<MessageExt, ClientError> {
        let space_id = self
            .cache
            .channel(channel_id)
            .map(|c| c.space_id)
            .ok_or_else(|| {
                ClientError::Other(format!("Channel {channel_id} not found in cache"))
            })?;

        self.http
            .api()
            .messages_create(
                space_id,
                channel_id,
                &MessageSendPayload {
                    content: content.into(),
                    attachments: None,
                },
            )
            .await
    }
}
