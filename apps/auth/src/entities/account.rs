use schemars::JsonSchema;
use sqlx::FromRow;
use uuid::Uuid;

use crate::error::Error;

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
