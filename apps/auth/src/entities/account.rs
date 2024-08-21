use schemars::JsonSchema;
use serde_json::json;
use sqlx::FromRow;
use uuid::Uuid;

use crate::error::Error;

#[derive(FromRow, Serialize, JsonSchema)]
#[sqlx(rename_all = "camelCase")]
#[schemars(example = "account_example")]
pub struct Account {
    pub id: Uuid,
    pub email: String,

    #[serde(skip)]
    pub passhash: String,
}

fn account_example() -> serde_json::Value {
    json!({
        "id": "ba48ec91-7ca6-4c23-9950-36b26857a05b",
        "email": "misaka.mikoto@tokiwadai.ac.jp",
    })
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
        .bind(&self.email.trim().to_lowercase())
        .bind(&self.passhash)
        .execute(db)
        .await?;
        Ok(())
    }

    pub async fn find_by_id(id: &Uuid, db: &sqlx::PgPool) -> Result<Self, Error> {
        sqlx::query_as(r##"SELECT * FROM "Account" WHERE "id" = $1"##)
            .bind(id)
            .fetch_optional(db)
            .await?
            .ok_or(Error::NotFound)
    }

    pub async fn find_by_email(email: &str, db: &sqlx::PgPool) -> Result<Self, Error> {
        sqlx::query_as(r##"SELECT * FROM "Account" WHERE "email" = $1"##)
            .bind(email.trim().to_lowercase())
            .fetch_optional(db)
            .await?
            .ok_or(Error::NotFound)
    }

    pub async fn update_password(&self, password: &str, db: &sqlx::PgPool) -> Result<(), Error> {
        let passhash = bcrypt::hash(password, bcrypt::DEFAULT_COST)?;
        sqlx::query(
            r##"
            UPDATE "Account" SET "passhash" = $1 WHERE "id" = $2
            "##,
        )
        .bind(&passhash)
        .bind(&self.id)
        .execute(db)
        .await?;
        Ok(())
    }
}
