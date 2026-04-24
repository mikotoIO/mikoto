use aide::axum::routing::{get_with, post_with};
use axum::Json;
use schemars::JsonSchema;
use uuid::Uuid;

use crate::{
    db::db,
    entities::PushSubscription,
    error::Error,
    functions::{jwt::Claims, push},
};

use super::{router::AppRouter, ws::state::State};

#[derive(Serialize, JsonSchema)]
#[serde(rename_all = "camelCase")]
pub struct PushConfig {
    /// Base64 URL-safe encoded VAPID public key for PushManager.subscribe().
    /// Null when push is not configured on this server.
    pub public_key: Option<String>,
}

async fn config() -> Json<PushConfig> {
    Json(PushConfig {
        public_key: push::public_key().map(str::to_owned),
    })
}

#[derive(Deserialize, JsonSchema)]
#[serde(rename_all = "camelCase")]
pub struct SubscribePayload {
    pub endpoint: String,
    pub p256dh: String,
    pub auth: String,
}

#[derive(Serialize, JsonSchema)]
#[serde(rename_all = "camelCase")]
pub struct SubscribeResponse {
    pub id: Uuid,
}

async fn subscribe(
    claim: Claims,
    Json(body): Json<SubscribePayload>,
) -> Result<Json<SubscribeResponse>, Error> {
    if !push::is_enabled() {
        return Err(Error::new(
            "PushDisabled",
            http::StatusCode::SERVICE_UNAVAILABLE,
            "Push notifications are not configured on this server",
        ));
    }

    let user_id: Uuid = claim.sub.parse()?;
    let sub =
        PushSubscription::upsert(user_id, &body.endpoint, &body.p256dh, &body.auth, db()).await?;
    Ok(Json(SubscribeResponse { id: sub.id }))
}

#[derive(Deserialize, JsonSchema)]
#[serde(rename_all = "camelCase")]
pub struct UnsubscribePayload {
    pub endpoint: String,
}

async fn unsubscribe(
    claim: Claims,
    Json(body): Json<UnsubscribePayload>,
) -> Result<Json<()>, Error> {
    let user_id: Uuid = claim.sub.parse()?;
    PushSubscription::delete_by_endpoint(user_id, &body.endpoint, db()).await?;
    Ok(Json(()))
}

static TAG: &str = "Push";

pub fn router() -> AppRouter<State> {
    AppRouter::new()
        .route(
            "/config",
            get_with(config, |o| {
                o.tag(TAG)
                    .id("push.config")
                    .summary("Get Push Notification Config")
            }),
        )
        .route(
            "/subscribe",
            post_with(subscribe, |o| {
                o.tag(TAG)
                    .id("push.subscribe")
                    .summary("Register a Push Subscription")
            }),
        )
        .route(
            "/unsubscribe",
            post_with(unsubscribe, |o| {
                o.tag(TAG)
                    .id("push.unsubscribe")
                    .summary("Remove a Push Subscription")
            }),
        )
}
