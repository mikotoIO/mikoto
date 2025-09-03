use std::collections::HashMap;

use schemars::JsonSchema;
use sqlx::prelude::FromRow;
use std::hash::Hash;
use uuid::Uuid;

mod account;
mod bot;
mod channel;
mod document;
mod invite;
mod macros;
mod member;
mod message;
mod models;
mod role;
mod space;
mod user;

pub use account::*;
pub use bot::*;
pub use channel::*;
pub use document::*;
pub use invite::*;
pub use member::*;
pub use message::*;
pub use models::*;
pub use role::*;
pub use space::*;
pub use user::*;

pub struct MultiFactor {
    pub user_id: Uuid,

    pub secret: String,
    pub verified: bool,
}

#[derive(Serialize, JsonSchema)]
#[serde(rename_all = "camelCase")]
pub struct TokenPair {
    pub access_token: String,
    /// If the refresh token is not provided, you can continue using the same refresh token.
    pub refresh_token: Option<String>,
}

#[derive(FromRow)]
pub struct SocialAuth {
    pub id: Uuid,
    pub user_id: Uuid,

    pub provider: String,
    pub provider_id: String,
}

pub fn hashmap_by_key<T, K, F>(items: Vec<T>, key_fn: F) -> HashMap<K, T>
where
    F: Fn(&T) -> K,
    K: Eq + Hash,
{
    let mut map: HashMap<K, T> = HashMap::new();
    for item in items {
        let key = key_fn(&item);
        map.insert(key, item);
    }
    map
}

pub fn group_by_key<T, K, F>(items: Vec<T>, key_fn: F) -> HashMap<K, Vec<T>>
where
    F: Fn(&T) -> K,
    K: Eq + Hash,
{
    let mut grouped: HashMap<K, Vec<T>> = HashMap::new();
    for item in items {
        let key = key_fn(&item);
        grouped.entry(key).or_default().push(item);
    }
    grouped
}
