use aide::axum::routing::{get_with, post_with};
use axum::Json;
use schemars::JsonSchema;
use uuid::Uuid;

use crate::{
    db::db,
    entities::{MlsMessage, MlsMessageExt, MlsMessageSendItem},
    error::Error,
    functions::{jwt::Claims, pubsub::emit_event},
    routes::{router::AppRouter, ws::state::State},
};

#[derive(Deserialize, JsonSchema)]
#[serde(rename_all = "camelCase")]
pub struct MlsMessageSendPayload {
    pub messages: Vec<MlsMessageSendItem>,
}

async fn list_pending(claim: Claims) -> Result<Json<Vec<MlsMessageExt>>, Error> {
    let user_id: Uuid = claim.sub.parse()?;
    let messages = MlsMessage::fetch_pending(user_id, db()).await?;
    Ok(Json(messages.into_iter().map(Into::into).collect()))
}

async fn send(claim: Claims, Json(body): Json<MlsMessageSendPayload>) -> Result<Json<()>, Error> {
    let _sender_id: Uuid = claim.sub.parse()?;

    if body.messages.is_empty() {
        return Err(Error::BadRequest);
    }

    // Collect recipient IDs before the batch insert
    let recipient_ids: Vec<Uuid> = body
        .messages
        .iter()
        .map(|m| m.recipient_user_id)
        .collect();

    let created = MlsMessage::create_batch(&body.messages, db()).await?;

    // Notify each recipient via WebSocket
    for (msg, recipient_id) in created.into_iter().zip(recipient_ids) {
        let event_name = match msg.message_type.as_str() {
            "welcome" => "mls.onWelcome",
            _ => "mls.onHandshake",
        };
        let ext: MlsMessageExt = msg.into();
        emit_event(event_name, &ext, &format!("user:{recipient_id}")).await?;
    }

    Ok(().into())
}

static TAG: &str = "MLS";

pub fn router() -> AppRouter<State> {
    AppRouter::new()
        .route(
            "/",
            get_with(list_pending, |o| {
                o.tag(TAG)
                    .id("mlsMessages.list")
                    .summary("List Pending MLS Messages")
            }),
        )
        .route(
            "/",
            post_with(send, |o| {
                o.tag(TAG)
                    .id("mlsMessages.send")
                    .summary("Send MLS Messages")
            }),
        )
        .on_ws(|router| {
            router
                .event("onWelcome", |msg: MlsMessageExt, _| async move {
                    Some(msg)
                })
                .event("onHandshake", |msg: MlsMessageExt, _| async move {
                    Some(msg)
                })
        })
}
