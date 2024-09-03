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
