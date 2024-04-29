use std::sync::OnceLock;

use axum::{
    routing::{get, post},
    Json, Router,
};
use serde::Serialize;
use tower_http::cors::CorsLayer;

pub mod login;
pub mod register;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct IndexResponse {
    name: String,
    version: String,
}

pub async fn index() -> Json<&'static IndexResponse> {
    static RESP: OnceLock<IndexResponse> = OnceLock::new();
    Json(RESP.get_or_init(|| IndexResponse {
        name: "superego".to_string(),
        version: "*".to_string(),
    }))
}

pub fn router() -> Router {
    Router::new()
        .route("/", get(index))
        .route("/register", post(register::route))
        .layer(CorsLayer::permissive())
}
