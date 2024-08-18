use sqlx::prelude::FromRow;
use uuid::Uuid;

mod account;
mod refresh_token;

pub use account::*;
pub use refresh_token::*;

pub struct MultiFactor {
    pub user_id: Uuid,

    pub secret: String,
    pub verified: bool,
}

#[derive(FromRow)]
pub struct SocialAuth {
    pub id: Uuid,
    pub user_id: Uuid,

    pub provider: String,
    pub provider_id: String,
}
