use crate::generated::HttpApi;
use std::sync::RwLock;

pub struct HttpClient {
    client: reqwest::Client,
    base_url: String,
    token: RwLock<String>,
}

impl HttpClient {
    pub fn new(base_url: impl Into<String>) -> Self {
        Self {
            client: reqwest::Client::new(),
            base_url: base_url.into(),
            token: RwLock::new(String::new()),
        }
    }

    pub fn set_token(&self, token: impl Into<String>) {
        *self.token.write().unwrap() = token.into();
    }

    pub fn token(&self) -> String {
        self.token.read().unwrap().clone()
    }

    pub fn api(&self) -> HttpApi<'_> {
        // We need to hold a reference to token, but HttpApi borrows &str.
        // This is a limitation — callers should use api_with_token instead.
        // For now we'll provide the method that takes explicit params.
        panic!("Use api_with_token() or call methods directly")
    }

    pub fn raw_client(&self) -> &reqwest::Client {
        &self.client
    }

    pub fn base_url(&self) -> &str {
        &self.base_url
    }
}
