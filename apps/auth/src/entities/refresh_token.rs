use crate::{error::Error, functions::sha3::sha3};
use nanoid::nanoid;
use sqlx::FromRow;
use uuid::Uuid;

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

    pub async fn create(&self, db: &sqlx::PgPool) -> Result<(), Error> {
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
        .await?;
        Ok(())
    }

    pub async fn find_token(token: &str, db: &sqlx::PgPool) -> Result<Self, Error> {
        sqlx::query_as(r##"SELECT * FROM "RefreshToken" WHERE "token" = $1"##)
            .bind(token)
            .fetch_optional(db)
            .await?
            .ok_or(Error::NotFound)
    }

    pub async fn clear_all(account_id: Uuid, db: &sqlx::PgPool) -> Result<(), Error> {
        sqlx::query(
            r##"
            DELETE FROM "RefreshToken" WHERE "account_id" = $1
            "##,
        )
        .bind(&account_id)
        .execute(db)
        .await?;

        Ok(())
    }
}
