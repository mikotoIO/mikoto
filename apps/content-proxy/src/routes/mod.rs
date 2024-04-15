use std::sync::OnceLock;

use axum::{
    extract::DefaultBodyLimit,
    routing::{get, post},
    Json, Router,
};
use tower_http::cors::CorsLayer;

pub mod proxy;
pub mod serve;
pub mod upload;

#[derive(Debug, Serialize)]
pub struct IndexResponse {
    name: String,
    version: String,
}

pub async fn index() -> Json<&'static IndexResponse> {
    static RESP: OnceLock<IndexResponse> = OnceLock::new();
    RESP.get_or_init(|| IndexResponse {
        name: "media-server".to_string(),
        version: "*".to_string(),
    })
    .into()
}

pub fn router() -> Router {
    Router::new()
        .route("/", get(index))
        .route("/proxy", get(proxy::route))
        .route("/:store/*path", get(serve::route))
        .route("/:store", post(upload::route))
        .layer(DefaultBodyLimit::max(500 * 1024 * 1024))
        .layer(CorsLayer::permissive())
}
