use std::sync::{Arc, OnceLock};

use aide::{
    axum::{routing::get_with, IntoApiResponse},
    openapi::{Info, OpenApi},
};
use axum::{Extension, Json, Router};
use channels::voice;
use router::AppRouter;
use schemars::JsonSchema;
use serde::Serialize;
use tokio::sync::RwLock;
use tower_http::cors::CorsLayer;
use ws::state::State;

use crate::functions::pubsub::emit_event;

pub mod account;
pub mod bots;
pub mod channels;
pub mod router;
pub mod spaces;
pub mod users;
pub mod ws;

#[derive(Debug, Serialize, JsonSchema)]
#[serde(rename_all = "camelCase")]
pub struct IndexResponse {
    name: String,
    version: String,
}

pub async fn serve_api(Extension(api): Extension<OpenApi>) -> impl IntoApiResponse {
    Json(api)
}

pub async fn index() -> Json<&'static IndexResponse> {
    static RESP: OnceLock<IndexResponse> = OnceLock::new();
    Json(RESP.get_or_init(|| IndexResponse {
        name: "superego".to_string(),
        version: "*".to_string(),
    }))
}

#[derive(Serialize, Deserialize, JsonSchema)]
pub struct Ping {
    pub message: String,
}

pub fn router() -> Router {
    let router = AppRouter::<State>::new()
        .on_http(|router| {
            router
                .api_route("/", get_with(index, |o| o.id("index").summary("Index")))
                .nest("/account", account::router())
                .nest("/bots", bots::router())
        })
        .nest("users", "/users", users::router())
        .nest("relations", "/relations", users::relations::router())
        .nest("spaces", "/spaces", spaces::router())
        .nest("channels", "/spaces/:space_id/channels", channels::router())
        .nest(
            "messages",
            "/spaces/:space_id/channel/:channel_id/messages",
            channels::messages::router(),
        )
        .nest(
            "voice",
            "/spaces/:space_id/channels/:channel_id/voice",
            voice::router(),
        )
        .nest(
            "documents",
            "/spaces/:space_id/channel/:channel_id/documents",
            channels::documents::router(),
        )
        .nest(
            "members",
            "/spaces/:space_id/members",
            spaces::members::router(),
        )
        .nest("roles", "/spaces/:space_id/roles", spaces::roles::router())
        .ws_command("ping", |ping: Ping, state: Arc<RwLock<State>>| async move {
            let reader = state.read().await;
            emit_event("pong", ping, &format!("conn:{}", reader.conn_id)).await?;
            Ok(())
        })
        .ws_event("pong", |ping: Ping, _| async move { Some(ping) });

    router
        .build(OpenApi {
            info: Info {
                title: "Mikoto Superego".to_string(),
                ..Info::default()
            },
            ..OpenApi::default()
        })
        .layer(CorsLayer::permissive())
}
