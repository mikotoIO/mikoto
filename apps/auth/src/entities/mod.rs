use muonic_macros::Entity;
use nanoid::nanoid;
use sqlx::prelude::FromRow;
use uuid::Uuid;

use crate::functions::sha3::sha3;

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

#[derive(FromRow, Entity)]
pub struct RefreshToken {
    pub id: Uuid,
    pub token: String,
    pub user_id: Uuid,
    pub created_at: time::OffsetDateTime,
    pub expires_at: time::OffsetDateTime,
}

impl RefreshToken {
    pub fn new(user_id: Uuid) -> (Self, String) {
        let refresh_token = nanoid!(32);
        (
            Self {
                id: Uuid::new_v4(),
                token: sha3(&refresh_token),
                user_id,
                created_at: time::OffsetDateTime::now_utc(),
                expires_at: time::OffsetDateTime::now_utc() + time::Duration::days(30),
            },
            refresh_token,
        )
    }
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
