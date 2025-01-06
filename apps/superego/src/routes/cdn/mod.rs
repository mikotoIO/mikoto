use aide::axum::{routing::get, ApiRouter};

pub mod config;
pub mod serve;
pub mod upload;

pub fn router() -> ApiRouter {
    ApiRouter::new().route("/:store/*path", get(serve::route))
}
