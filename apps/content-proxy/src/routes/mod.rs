use std::sync::OnceLock;

use axum::{
    routing::{get, post},
    Json, Router,
};
use tower_http::cors::CorsLayer;

pub mod serve;
pub mod upload;

#[derive(Debug, Serialize)]
pub struct IndexResponse {
    name: String,
    version: String,
}

pub async fn index() -> Json<&'static IndexResponse> {
    static RESP: OnceLock<IndexResponse> = OnceLock::new();
    Json(RESP.get_or_init(|| IndexResponse {
        name: "media-server".to_string(),
        version: "*".to_string(),
    }))
}

pub fn router() -> Router {
    Router::new()
        .route("/", get(index))
        .route("/:store/*path", get(serve::route))
        .route("/:store", post(upload::route))
        .layer(CorsLayer::permissive())
}
