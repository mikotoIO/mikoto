use std::sync::OnceLock;

use aide::{
    axum::{routing::get, ApiRouter, IntoApiResponse},
    openapi::{Info, OpenApi},
    scalar::Scalar,
};
use axum::{Extension, Json, Router};
use schemars::JsonSchema;
use serde::Serialize;
use tower_http::cors::CorsLayer;
use ws::{schema::WebSocketRouter, MikotoWebsocketRouter};

pub mod account;
pub mod bots;
pub mod channels;
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

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
pub struct Foo {
    bar: String,
}

pub fn router() -> Router {
    let mut api = OpenApi {
        info: Info {
            title: "Mikoto Auth Server".to_string(),
            ..Info::default()
        },
        ..OpenApi::default()
    };

    let ws = MikotoWebsocketRouter::new().event("foo_events", |foo: Foo, _| Some(foo));
    api.extensions
        .insert("websocket".to_string(), ws.build_schema_ext());

    let router = ApiRouter::<()>::new()
        .api_route("/", get(index))
        .nest("/account", account::router())
        .nest("/bots", bots::router())
        .nest("/channels", channels::router())
        .nest(
            "/channel/:channel_id/documents",
            channels::documents::router(),
        )
        .nest(
            "/channel/:channel_id/messages",
            channels::messages::router(),
        )
        .nest("/spaces", spaces::router())
        .nest("/spaces/:space_id/roles", spaces::roles::router())
        .route("/ws", ws::handler(ws))
        .route("/api.json", axum::routing::get(serve_api))
        .route("/scalar", Scalar::new("/api.json").axum_route())
        .layer(CorsLayer::permissive());

    router.finish_api(&mut api).layer(Extension(api))
}
