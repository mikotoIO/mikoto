use aide::{
    axum::{ApiRouter, IntoApiResponse},
    openapi::OpenApi,
    scalar::Scalar,
};
use axum::{Extension, Json, Router};

use super::ws::{self, schema::WebSocketRouter, WebSocketState};

pub struct AppRouter<W: WebSocketState> {
    pub http: ApiRouter,
    pub ws: WebSocketRouter<W>,
}

async fn serve_api(Extension(api): Extension<OpenApi>) -> impl IntoApiResponse {
    Json(api)
}

impl<W: WebSocketState> AppRouter<W> {
    pub fn new() -> Self {
        let http = ApiRouter::new();
        let ws = WebSocketRouter::new();
        Self { http, ws }
    }

    pub fn nest(mut self, key: &str, path: &str, other: AppRouter<W>) -> Self {
        self.http = self.http.nest(path, other.http);
        self.ws = self.ws.nest(key, other.ws);
        self
    }

    pub fn on_http<F>(mut self, f: F) -> Self
    where
        F: FnOnce(ApiRouter<()>) -> ApiRouter<()>,
    {
        self.http = f(self.http);
        self
    }

    pub fn on_ws<F>(mut self, f: F) -> Self
    where
        F: FnOnce(WebSocketRouter<W>) -> WebSocketRouter<W>,
    {
        self.ws = f(self.ws);
        self
    }

    pub fn build(self, mut api: OpenApi) -> Router {
        let Self { http, ws } = self;

        api.extensions
            .insert("websocket".to_string(), ws.build_schema_ext());

        let http = http
            .route("/ws", ws::handler(ws))
            .route("/api.json", axum::routing::get(serve_api))
            .route("/scalar", Scalar::new("/api.json").axum_route());

        http.finish_api(&mut api).layer(Extension(api))
    }
}
