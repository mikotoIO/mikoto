use std::sync::Arc;

use uuid::Uuid;

use tokio::sync::mpsc;

use crate::cache::Cache;
use crate::client::MikotoClient;
use crate::context::Context;
use crate::error::ClientError;
use crate::generated::{BotLoginPayload, WsCommand, WsEvent};
use crate::handler::EventHandler;

/// High-level bot client with automatic caching and event dispatch.
///
/// # Example
///
/// ```ignore
/// use mikoto_client::{BotClient, EventHandler, Context, MessageExt};
/// use async_trait::async_trait;
/// use uuid::Uuid;
///
/// struct PingBot;
///
/// #[async_trait]
/// impl EventHandler for PingBot {
///     async fn message_create(&self, ctx: Context, message: MessageExt) {
///         if message.content.trim() == "/ping" {
///             ctx.send_message(message.channel_id, "pong!").await.ok();
///         }
///     }
/// }
///
/// #[tokio::main]
/// async fn main() -> Result<(), Box<dyn std::error::Error>> {
///     let bot = BotClient::builder("http://localhost:3511", bot_id, "token")
///         .event_handler(PingBot)
///         .build()
///         .await?;
///
///     bot.start().await?;
///     Ok(())
/// }
/// ```
pub struct BotClient {
    http: Arc<MikotoClient>,
    cache: Arc<Cache>,
    handler: Arc<dyn EventHandler>,
}

pub struct BotClientBuilder {
    base_url: String,
    bot_id: Uuid,
    bot_token: String,
    handler: Option<Arc<dyn EventHandler>>,
}

impl BotClientBuilder {
    /// Set the event handler.
    pub fn event_handler(mut self, handler: impl EventHandler + 'static) -> Self {
        self.handler = Some(Arc::new(handler));
        self
    }

    /// Login as the bot, populate the cache, and return a ready [`BotClient`].
    pub async fn build(self) -> Result<BotClient, ClientError> {
        let handler = self
            .handler
            .ok_or_else(|| ClientError::Other("event_handler is required".into()))?;

        // Login
        let unauthenticated = MikotoClient::new(&self.base_url, "");
        let token_pair = unauthenticated
            .api()
            .bots_login(&BotLoginPayload {
                bot_id: self.bot_id,
                token: self.bot_token,
            })
            .await?;

        let http = Arc::new(MikotoClient::new(&self.base_url, &token_pair.access_token));

        // Populate cache
        let cache = Arc::new(Cache::new());

        let current_user = http.api().user_get().await?;
        cache.set_current_user(current_user);

        let spaces = http.api().spaces_list().await?;
        cache.populate_from_spaces(&spaces);

        tracing::info!(
            spaces = spaces.len(),
            channels = cache.channels().len(),
            "cache populated"
        );

        Ok(BotClient {
            http,
            cache,
            handler,
        })
    }
}

impl BotClient {
    /// Create a builder for a new bot client.
    pub fn builder(
        base_url: impl Into<String>,
        bot_id: Uuid,
        bot_token: impl Into<String>,
    ) -> BotClientBuilder {
        BotClientBuilder {
            base_url: base_url.into(),
            bot_id,
            bot_token: bot_token.into(),
            handler: None,
        }
    }

    /// Connect to the WebSocket and run the event loop until disconnected.
    ///
    /// This method blocks until the WebSocket connection is closed.
    pub async fn start(&self) -> Result<(), ClientError> {
        let mut ws = self.http.connect_ws().await?;
        let (ws_tx, mut ws_rx) = mpsc::unbounded_channel::<WsCommand>();

        let ctx = Context::new(Arc::clone(&self.http), Arc::clone(&self.cache), ws_tx);
        self.handler.ready(ctx.clone()).await;

        tracing::info!("connected to websocket, dispatching events");

        loop {
            tokio::select! {
                text = ws.recv_text() => {
                    let text = match text? {
                        Some(t) => t,
                        None => {
                            tracing::info!("websocket closed");
                            break;
                        }
                    };

                    let event: WsEvent = match serde_json::from_str(&text) {
                        Ok(ev) => ev,
                        Err(e) => {
                            tracing::trace!(error = %e, "skipping unknown ws event");
                            continue;
                        }
                    };

                    // Update cache before dispatching to handler
                    self.cache.update(&event);

                    let ctx = ctx.clone();
                    let handler = Arc::clone(&self.handler);

                    tokio::spawn(async move {
                        dispatch_event(handler.as_ref(), ctx, event).await;
                    });
                }
                Some(cmd) = ws_rx.recv() => {
                    ws.send(&cmd).await?;
                }
            }
        }

        Ok(())
    }
}

async fn dispatch_event(handler: &dyn EventHandler, ctx: Context, event: WsEvent) {
    match event {
        WsEvent::MessagesOnCreate(msg) => handler.message_create(ctx, msg).await,
        WsEvent::MessagesOnUpdate(msg) => handler.message_update(ctx, msg).await,
        WsEvent::MessagesOnDelete(key) => handler.message_delete(ctx, key).await,

        WsEvent::ChannelsOnCreate(ch) => handler.channel_create(ctx, ch).await,
        WsEvent::ChannelsOnUpdate(ch) => handler.channel_update(ctx, ch).await,
        WsEvent::ChannelsOnDelete(ch) => handler.channel_delete(ctx, ch).await,

        WsEvent::MembersOnCreate(m) => handler.member_create(ctx, m).await,
        WsEvent::MembersOnUpdate(m) => handler.member_update(ctx, m).await,
        WsEvent::MembersOnDelete(m) => handler.member_delete(ctx, m).await,

        WsEvent::RolesOnCreate(r) => handler.role_create(ctx, r).await,
        WsEvent::RolesOnUpdate(r) => handler.role_update(ctx, r).await,
        WsEvent::RolesOnDelete(r) => handler.role_delete(ctx, r).await,

        WsEvent::SpacesOnCreate(s) => handler.space_create(ctx, s).await,
        WsEvent::SpacesOnUpdate(s) => handler.space_update(ctx, s).await,
        WsEvent::SpacesOnDelete(s) => handler.space_delete(ctx, s).await,

        WsEvent::UsersOnCreate(u) => handler.user_create(ctx, u).await,
        WsEvent::UsersOnUpdate(u) => handler.user_update(ctx, u).await,
        WsEvent::UsersOnDelete(obj) => handler.user_delete(ctx, obj.id).await,

        WsEvent::TypingOnUpdate(u) => handler.typing_update(ctx, u).await,

        WsEvent::Pong(_) => {}

        // Relation events are handled client-side only
        WsEvent::RelationsOnCreate(_)
        | WsEvent::RelationsOnUpdate(_)
        | WsEvent::RelationsOnDelete(_) => {}
    }
}
