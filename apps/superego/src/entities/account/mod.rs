use schemars::JsonSchema;
use serde_json::json;
use sqlx::FromRow;
use uuid::Uuid;

use crate::error::Error;

pub mod refresh_token;
pub mod verification;

pub use refresh_token::*;
pub use verification::*;

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
    pub async fn create<'c, X: sqlx::PgExecutor<'c>>(&self, db: X) -> Result<(), Error> {
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

    pub async fn create_with_user<'c, X: sqlx::PgExecutor<'c>>(
        &self,
        name: &str,
        db: X,
    ) -> Result<(), Error> {
        sqlx::query(
            r##"
            WITH u AS (
                INSERT INTO "User" ("id", "name")
                VALUES ($1, $2)
                RETURNING "id"
            )
            INSERT INTO "Account" ("id", "email", "passhash")
            VALUES ((SELECT "id" FROM u), $3, $4)
            "##,
        )
        .bind(&self.id)
        .bind(name)
        .bind(&self.email.trim().to_lowercase())
        .bind(&self.passhash)
        .execute(db)
        .await?;
        Ok(())
    }

    pub async fn find_by_id<'c, X: sqlx::PgExecutor<'c>>(id: &Uuid, db: X) -> Result<Self, Error> {
        sqlx::query_as(r##"SELECT * FROM "Account" WHERE "id" = $1"##)
            .bind(id)
            .fetch_optional(db)
            .await?
            .ok_or(Error::NotFound)
    }

    pub async fn find_by_email<'c, X: sqlx::PgExecutor<'c>>(
        email: &str,
        db: X,
    ) -> Result<Self, Error> {
        sqlx::query_as(r##"SELECT * FROM "Account" WHERE "email" = $1"##)
            .bind(email.trim().to_lowercase())
            .fetch_optional(db)
            .await?
            .ok_or(Error::NotFound)
    }

    pub async fn update_password<'c, X: sqlx::PgExecutor<'c>>(
        &self,
        password: &str,
        db: X,
    ) -> Result<(), Error> {
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
