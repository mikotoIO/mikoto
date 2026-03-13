use async_trait::async_trait;
use uuid::Uuid;

use crate::context::Context;
use crate::generated::*;

/// Trait for handling Mikoto events.
///
/// Implement only the methods you care about — all methods have default
/// no-op implementations, so unhandled events are silently ignored.
///
/// # Example
///
/// ```ignore
/// use mikoto_client::{EventHandler, Context, MessageExt};
/// use async_trait::async_trait;
///
/// struct MyBot;
///
/// #[async_trait]
/// impl EventHandler for MyBot {
///     async fn message_create(&self, ctx: Context, message: MessageExt) {
///         if message.content.trim() == "/ping" {
///             ctx.send_message(message.channel_id, "pong!").await.ok();
///         }
///     }
/// }
/// ```
#[async_trait]
pub trait EventHandler: Send + Sync {
    /// Called after login, cache population, and WebSocket connection.
    async fn ready(&self, _ctx: Context) {}

    async fn message_create(&self, _ctx: Context, _message: MessageExt) {}
    async fn message_update(&self, _ctx: Context, _message: MessageExt) {}
    async fn message_delete(&self, _ctx: Context, _key: MessageKey) {}

    async fn channel_create(&self, _ctx: Context, _channel: Channel) {}
    async fn channel_update(&self, _ctx: Context, _channel: Channel) {}
    async fn channel_delete(&self, _ctx: Context, _channel: Channel) {}

    async fn member_create(&self, _ctx: Context, _member: MemberExt) {}
    async fn member_update(&self, _ctx: Context, _member: MemberExt) {}
    async fn member_delete(&self, _ctx: Context, _member: MemberExt) {}

    async fn role_create(&self, _ctx: Context, _role: Role) {}
    async fn role_update(&self, _ctx: Context, _role: Role) {}
    async fn role_delete(&self, _ctx: Context, _role: Role) {}

    async fn space_create(&self, _ctx: Context, _space: SpaceExt) {}
    async fn space_update(&self, _ctx: Context, _space: SpaceExt) {}
    async fn space_delete(&self, _ctx: Context, _space: SpaceExt) {}

    async fn user_create(&self, _ctx: Context, _user: UserExt) {}
    async fn user_update(&self, _ctx: Context, _user: UserExt) {}
    async fn user_delete(&self, _ctx: Context, _id: Uuid) {}
}
