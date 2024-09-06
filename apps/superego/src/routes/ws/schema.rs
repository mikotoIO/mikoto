use std::collections::BTreeMap;

use jsonwebtoken::errors::Error;
use schemars::{schema::Schema, JsonSchema};
use serde::{de::DeserializeOwned, Serialize};

pub struct WebSocketRouter<S> {
    pub commands: BTreeMap<String, Schema>,
    pub events: BTreeMap<String, Schema>,

    pub _state: std::marker::PhantomData<S>,
    pub event_filters:
        BTreeMap<String, Box<dyn Fn(serde_json::Value, S) -> Result<bool, Error> + Send + Sync>>,
}

#[derive(Serialize, Clone)]
pub struct WebSocketRouterSchema {
    pub commands: BTreeMap<String, Schema>,
    pub events: BTreeMap<String, Schema>,
}

impl<S> WebSocketRouter<S> {
    pub fn new() -> Self {
        Self {
            commands: BTreeMap::new(),
            events: BTreeMap::new(),
            _state: std::marker::PhantomData,
            event_filters: BTreeMap::new(),
        }
    }

    pub fn command<T>(mut self, name: &str) -> Self
    where
        T: JsonSchema,
    {
        let schema = aide::gen::in_context(|ctx| ctx.schema.subschema_for::<T>());
        self.commands.insert(name.to_string(), schema);
        self
    }

    pub fn event<T, F>(mut self, name: &str, filter: F) -> Self
    where
        T: JsonSchema + Serialize + DeserializeOwned,
        F: Fn(T, S) -> bool + 'static + Send + Sync,
    {
        let schema = aide::gen::in_context(|ctx| ctx.schema.subschema_for::<T>());
        self.events.insert(name.to_string(), schema);
        self.event_filters.insert(
            name.to_string(),
            Box::new(move |value, state| Ok(filter(serde_json::from_value(value)?, state))),
        );
        self
    }

    pub fn merge(mut self, other: Self) -> Self {
        self.commands.extend(other.commands);
        self.events.extend(other.events);
        self.event_filters.extend(other.event_filters);
        self
    }

    pub fn build_schema_ext(&self) -> serde_json::Value {
        serde_json::to_value(WebSocketRouterSchema {
            commands: self.commands.clone(),
            events: self.events.clone(),
        })
        .unwrap()
    }
}
