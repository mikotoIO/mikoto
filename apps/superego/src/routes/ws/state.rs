use serde::{de::DeserializeOwned, Serialize};
use uuid::Uuid;

use super::WebSocketState;

pub struct State {
    pub conn_id: Uuid,
}

#[derive(Deserialize)]
pub struct WebsocketParams {
    pub token: Option<String>,
}

#[async_trait]
impl WebSocketState for State {
    type Initial = WebsocketParams;

    fn new() -> Self {
        Self {
            conn_id: Uuid::new_v4(),
        }
    }

    async fn initialize(&mut self, _init: Self::Initial) -> Option<Vec<String>> {
        Some(vec!["all".to_string(), self.conn_id.to_string()])
    }
}

pub trait SocketEvent
where
    Self: Sized + Serialize + DeserializeOwned,
{
    fn name() -> &'static str;
    fn into_message(self, state: State) -> Option<Self>;
}
