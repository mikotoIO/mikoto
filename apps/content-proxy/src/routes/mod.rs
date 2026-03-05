use std::sync::OnceLock;

use axum::http::header::{AUTHORIZATION, CONTENT_TYPE};
use axum::{
    extract::DefaultBodyLimit,
    routing::{get, post},
    Json, Router,
};
use tower_http::cors::CorsLayer;

use crate::env::env;

pub mod default_avatar;
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
    let cors = CorsLayer::new()
        .allow_methods(tower_http::cors::Any)
        .allow_headers([AUTHORIZATION, CONTENT_TYPE]);

    let cors = if let Some(ref origin) = env().cors_origin {
        let origin = origin
            .parse::<axum::http::HeaderValue>()
            .expect("CORS_ORIGIN must be a valid header value");
        cors.allow_origin(origin)
    } else {
        cors.allow_origin(tower_http::cors::Any)
    };

    Router::new()
        .route("/", get(index))
        .route("/proxy", get(proxy::route))
        .route("/default-avatar/:id", get(default_avatar::route))
        .route("/:store/*path", get(serve::route))
        .route(
            "/:store",
            post(upload::route).layer(DefaultBodyLimit::max(50 * 1024 * 1024)),
        )
        .layer(cors)
}
