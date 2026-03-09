use std::sync::OnceLock;

use axum::http::header::{AUTHORIZATION, CONTENT_TYPE};
use axum::{
    extract::{DefaultBodyLimit, Request},
    middleware,
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

async fn security_headers(request: Request, next: middleware::Next) -> axum::response::Response {
    let mut response = next.run(request).await;
    let headers = response.headers_mut();
    headers.insert("X-Content-Type-Options", "nosniff".parse().unwrap());
    headers.insert("X-Frame-Options", "DENY".parse().unwrap());
    headers.insert(
        "Referrer-Policy",
        "strict-origin-when-cross-origin".parse().unwrap(),
    );
    headers.insert(
        "Permissions-Policy",
        "camera=(), microphone=(), geolocation=()".parse().unwrap(),
    );
    response
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
        log::warn!("CORS_ORIGIN not set — allowing all origins. Set CORS_ORIGIN in production!");
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
        .layer(middleware::from_fn(security_headers))
        .layer(cors)
}
