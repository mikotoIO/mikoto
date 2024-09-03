use serde::{de::DeserializeOwned, Serialize};
use uuid::Uuid;

pub struct WebsocketState {
    pub conn_id: Uuid,
}

impl WebsocketState {
    pub fn new() -> Self {
        Self {
            conn_id: Uuid::new_v4(),
        }
    }
}

pub trait SocketEvent
where
    Self: Sized + Serialize + DeserializeOwned,
{
    fn name() -> &'static str;
    fn into_message(self, state: WebsocketState) -> Option<Self>;
}
