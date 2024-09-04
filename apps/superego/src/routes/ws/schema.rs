use std::collections::BTreeMap;

use aide::openapi::{ReferenceOr, SchemaObject};

#[derive(Serialize)]
pub struct WebsocketSchema {
    pub commands: BTreeMap<String, ReferenceOr<SchemaObject>>,
    pub events: BTreeMap<String, ReferenceOr<SchemaObject>>,
}

pub fn websocket_openapi_extension() -> serde_json::Value {
    let schema = WebsocketSchema {
        commands: BTreeMap::new(),
        events: BTreeMap::new(),
    };
    serde_json::to_value(schema).unwrap()
}
