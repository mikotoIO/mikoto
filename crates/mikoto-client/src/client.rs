use crate::error::ClientError;
use crate::generated::HttpApi;
use crate::ws::WsConnection;

pub struct MikotoClient {
    client: reqwest::Client,
    base_url: String,
    token: String,
}

impl MikotoClient {
    pub fn new(base_url: impl Into<String>, token: impl Into<String>) -> Self {
        Self {
            client: reqwest::Client::new(),
            base_url: base_url.into(),
            token: token.into(),
        }
    }

    pub fn set_token(&mut self, token: impl Into<String>) {
        self.token = token.into();
    }

    pub fn api(&self) -> HttpApi<'_> {
        HttpApi {
            client: &self.client,
            base_url: &self.base_url,
            token: &self.token,
        }
    }

    pub async fn connect_ws(&self) -> Result<WsConnection, ClientError> {
        let ws_url = self.base_url.replace("http", "ws") + "/ws";
        WsConnection::connect(&ws_url, &self.token).await
    }
}
