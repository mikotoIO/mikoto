use std::sync::OnceLock;

use aide::{
    axum::{
        routing::{get, post, post_with},
        ApiRouter, IntoApiResponse,
    },
    openapi::{Info, OpenApi},
    scalar::Scalar,
};
use axum::{Extension, Json, Router};
use schemars::JsonSchema;
use serde::Serialize;
use tower_http::cors::CorsLayer;

pub mod bots;
pub mod change_password;
pub mod login;
pub mod refresh;
pub mod register;
pub mod reset_password;

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
        .api_route(
            "/account/register",
            post_with(register::route, |o| o.summary("User Registration")),
        )
        .api_route(
            "/account/login",
            post_with(login::route, |o| o.summary("User Login")),
        )
        .api_route(
            "/account/refresh",
            post_with(refresh::route, |o| o.summary("Refresh Access Token")),
        )
        .api_route(
            "/account/change_password",
            post_with(change_password::route, |o| o.summary("Change Password")),
        )
        .api_route(
            "/account/reset_password",
            post_with(reset_password::route, |o| o.summary("Reset Password")),
        )
        .api_route(
            "/account/reset_password/submit",
            post_with(reset_password::confirm, |o| {
                o.summary("Confirm Password Reset")
            }),
        )
        .api_route(
            "/bot",
            post_with(bots::create_bot, |o| o.summary("Create Bot")),
        )
        .route("/api.json", axum::routing::get(serve_api))
        .route("/scalar", Scalar::new("/api.json").axum_route())
        .layer(CorsLayer::permissive());

    router.finish_api(&mut api).layer(Extension(api))
}
