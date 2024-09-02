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

pub mod account;
pub mod bots;
pub mod spaces;

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

pub fn router() -> Router {
    let mut api = OpenApi {
        info: Info {
            title: "Mikoto Auth Server".to_string(),
            ..Info::default()
        },
        ..OpenApi::default()
    };

    let router = ApiRouter::<()>::new()
        .api_route("/", get(index))
        .nest("/account", account::router())
        .nest("/bots", bots::router())
        .route("/api.json", axum::routing::get(serve_api))
        .route("/scalar", Scalar::new("/api.json").axum_route())
        .layer(CorsLayer::permissive());

    router.finish_api(&mut api).layer(Extension(api))
}
