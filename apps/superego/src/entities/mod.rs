use schemars::JsonSchema;
use sqlx::prelude::FromRow;
use uuid::Uuid;

mod account;
mod bot;
mod channel;
mod macros;
mod models;
mod space;
mod user;

pub use account::*;
pub use bot::*;
pub use channel::*;
pub use models::*;
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
