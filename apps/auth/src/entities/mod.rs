use schemars::JsonSchema;
use sqlx::prelude::FromRow;
use uuid::Uuid;

mod account;
mod bot;
mod refresh_token;
mod user;
mod verification;

pub use account::*;
pub use bot::*;
pub use refresh_token::*;
pub use user::*;
pub use verification::*;

pub struct MultiFactor {
    pub user_id: Uuid,

    pub secret: String,
    pub verified: bool,
}

#[derive(Serialize, JsonSchema)]
#[serde(rename_all = "camelCase")]
pub struct TokenPair {
    pub access_token: String,
    pub refresh_token: String,
}

#[derive(FromRow)]
pub struct SocialAuth {
    pub id: Uuid,
    pub user_id: Uuid,

    pub provider: String,
    pub provider_id: String,
}
