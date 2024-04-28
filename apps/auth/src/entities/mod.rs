use muonic_macros::Entity;
use sqlx::prelude::FromRow;
use uuid::Uuid;

#[derive(FromRow, Entity, Serialize)]
pub struct User {
    pub id: Uuid,
    pub name: String,
}

#[derive(FromRow, Entity)]
pub struct EmailAuth {
    pub id: Uuid, // is also the account_id

    pub email: String,
    pub passhash: Option<String>, // None, if using a "magic link"
}

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
