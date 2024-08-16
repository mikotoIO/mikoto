use nanoid::nanoid;
use sqlx::prelude::FromRow;
use uuid::Uuid;

use crate::functions::sha3::sha3;

#[derive(FromRow, Serialize)]
#[sqlx(rename_all = "camelCase")]
pub struct Account {
    pub id: Uuid,
    pub email: String,
    pub passhash: String,
}

#[derive(FromRow)]
#[sqlx(rename_all = "camelCase")]
pub struct RefreshToken {
    pub id: Uuid,
    pub token: String,
    pub expires_at: time::OffsetDateTime,
    pub account_id: Uuid,
}

impl RefreshToken {
    pub fn new(account_id: Uuid) -> (Self, String) {
        let refresh_token = nanoid!(32);
        (
            Self {
                id: Uuid::new_v4(),
                token: sha3(&refresh_token),
                account_id,
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
