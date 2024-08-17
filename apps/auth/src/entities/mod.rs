use nanoid::nanoid;
use schemars::JsonSchema;
use sqlx::{postgres::PgQueryResult, prelude::FromRow};
use uuid::Uuid;

use crate::{error::Error, functions::sha3::sha3};

#[derive(FromRow, Serialize, JsonSchema)]
#[sqlx(rename_all = "camelCase")]
pub struct Account {
    pub id: Uuid,
    pub email: String,
    pub passhash: String,
}

impl Account {
    pub async fn create(&self, db: &sqlx::PgPool) -> Result<(), Error> {
        sqlx::query(
            r##"
            INSERT INTO "Account" ("id", "email", "passhash")
            VALUES ($1, $2, $3)
            "##,
        )
        .bind(&Uuid::new_v4())
        .bind(&self.email)
        .bind(&self.passhash)
        .execute(db)
        .await?;
        Ok(())
    }

    pub async fn find_by_email(email: &str, db: &sqlx::PgPool) -> Result<Self, Error> {
        sqlx::query_as(r##"SELECT * FROM "Account" WHERE "email" = $1"##)
            .bind(email)
            .fetch_optional(db)
            .await?
            .ok_or(Error::NotFound)
    }
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

    pub async fn create(&self, db: &sqlx::PgPool) -> Result<PgQueryResult, sqlx::Error> {
        sqlx::query(
            r##"
            INSERT INTO "RefreshToken" ("id", "token", "expires_at", "account_id")
            VALUES ($1, $2, $3, $4)
            "##,
        )
        .bind(&self.id)
        .bind(&self.token)
        .bind(&self.expires_at)
        .bind(&self.account_id)
        .execute(db)
        .await
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
