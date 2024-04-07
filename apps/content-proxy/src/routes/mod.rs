use axum::{
    routing::{get, post},
    Router,
};
use tower_http::cors::CorsLayer;

pub mod serve;
pub mod upload;

pub async fn hello() -> &'static str {
    "Hello, World!"
}

pub fn router() -> Router {
    Router::new()
        .route("/", get(hello))
        .route("/:store/*path", get(serve::route))
        .route("/:store", post(upload::route))
        .layer(CorsLayer::permissive())
}
