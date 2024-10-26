use std::{collections::BTreeMap, future::Future, sync::Arc};

use futures_util::{future::BoxFuture, FutureExt};
use schemars::{schema::Schema, JsonSchema};
use serde::{de::DeserializeOwned, Serialize};
use serde_json::Value;
use tokio::sync::RwLock;

use crate::error::Error;

pub struct WebSocketRouter<S> {
    pub commands: BTreeMap<String, Schema>,
    pub events: BTreeMap<String, Schema>,

    pub command_filters: BTreeMap<
        String,
        Box<dyn Fn(Value, Arc<RwLock<S>>) -> BoxFuture<'static, Result<(), Error>> + Send + Sync>,
    >,

    pub event_filters: BTreeMap<
        String,
        Box<
            dyn Fn(Value, Arc<RwLock<S>>) -> BoxFuture<'static, Result<Option<Value>, Error>>
                + Send
                + Sync,
        >,
    >,
}

#[derive(Serialize, Clone)]
pub struct WebSocketRouterSchema {
    pub commands: BTreeMap<String, Schema>,
    pub events: BTreeMap<String, Schema>,
}

impl<S: 'static + Send + Sync> WebSocketRouter<S> {
    pub fn new() -> Self {
        Self {
            commands: BTreeMap::new(),
            events: BTreeMap::new(),

            command_filters: BTreeMap::new(),
            event_filters: BTreeMap::new(),
        }
    }

    pub fn command<T, F, Fut>(mut self, name: &str, func: F) -> Self
    where
        T: JsonSchema + DeserializeOwned,
        F: Fn(T, Arc<RwLock<S>>) -> Fut + 'static + Send + Sync + Copy,
        Fut: Future<Output = Result<(), Error>> + Send,
    {
        let schema = aide::gen::in_context(|ctx| ctx.schema.subschema_for::<T>());
        self.commands.insert(name.to_string(), schema);
        self.command_filters.insert(
            name.to_string(),
            Box::new(move |value, state| {
                async move {
                    let parsed = serde_json::from_value(value)?;
                    func(parsed, state).await
                }
                .boxed()
            }),
        );
        self
    }

    pub fn event<T, R, F, Fut>(mut self, name: &str, filter: F) -> Self
    where
        T: Serialize + DeserializeOwned,
        R: JsonSchema + Serialize,
        F: Fn(T, Arc<RwLock<S>>) -> Fut + 'static + Send + Sync + Copy,
        Fut: Future<Output = Option<R>> + Send + Sync,
    {
        let schema = aide::gen::in_context(|ctx| ctx.schema.subschema_for::<R>());
        self.events.insert(name.to_string(), schema);
        self.event_filters.insert(
            name.to_string(),
            Box::new(move |value, state| {
                async move {
                    let parsed = serde_json::from_value(value)?;
                    let result = filter(parsed, state).await;
                    if let Some(result) = result {
                        Ok(Some(serde_json::to_value(result)?))
                    } else {
                        Ok(None)
                    }
                }
                .boxed()
            }),
        );
        self
    }

    pub fn merge(mut self, other: Self) -> Self {
        self.commands.extend(other.commands);
        self.events.extend(other.events);
        self.command_filters.extend(other.command_filters);
        self.event_filters.extend(other.event_filters);
        self
    }

    pub fn nest(mut self, prefix: &str, other: Self) -> Self {
        let prefix = prefix.trim_end_matches('/');
        self.commands.extend(prefix_map(prefix, other.commands));
        self.events.extend(prefix_map(prefix, other.events));
        self.command_filters
            .extend(prefix_map(prefix, other.command_filters));
        self.event_filters
            .extend(prefix_map(prefix, other.event_filters));

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

fn prefix_map<T>(prefix: &str, map: BTreeMap<String, T>) -> BTreeMap<String, T> {
    map.into_iter()
        .map(|(k, v)| (format!("{}.{}", prefix, k), v))
        .collect()
}
