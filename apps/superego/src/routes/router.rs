use aide::axum::ApiRouter;

use super::ws::{schema::WebSocketRouter, WebSocketState};

pub struct AppRouter<S, W: WebSocketState> {
    pub http: ApiRouter<S>,
    pub ws: WebSocketRouter<W>,
}

impl<S: Clone + Send + Sync + 'static, W: WebSocketState> AppRouter<S, W> {
    pub fn new() -> Self {
        let http = ApiRouter::new();
        let ws = WebSocketRouter::new();
        Self { http, ws }
    }

    pub fn nest(mut self, key: &str, path: &str, other: AppRouter<S, W>) -> Self {
        self.http = self.http.nest(path, other.http);
        self.ws = self.ws.nest(key, other.ws);
        self
    }

    pub fn on_http<F>(mut self, f: F) -> Self
    where
        F: FnOnce(ApiRouter<S>) -> ApiRouter<S>,
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
}
