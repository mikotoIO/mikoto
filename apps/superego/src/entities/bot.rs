use uuid::Uuid;

use crate::{entity, error::Error, model};

entity!(
    pub struct Bot {
        pub id: Uuid,
        pub name: String,
        pub owner_id: Uuid,

        #[serde(skip_serializing)]
        pub secret: String,
    }
);

// Response returned only when creating a bot, containing the plaintext token.
// This is the only time the token is visible.
model!(
    pub struct BotCreatedResponse {
        pub id: Uuid,
        pub name: String,
        pub owner_id: Uuid,
        pub token: String,
    }
);

impl Bot {
    pub async fn list<'c, X: sqlx::PgExecutor<'c>>(
        owner_id: Uuid,
        db: X,
    ) -> Result<Vec<Self>, Error> {
        let bots = sqlx::query_as(r#"SELECT * FROM "Bot" WHERE "ownerId" = $1"#)
            .bind(owner_id)
            .fetch_all(db)
            .await?;
        Ok(bots)
    }

    pub async fn create<'c, X: sqlx::PgExecutor<'c>>(&self, db: X) -> Result<(), Error> {
        sqlx::query(
            r##"
            INSERT INTO "Bot" ("id", "name", "ownerId", "secret")
            VALUES ($1, $2, $3, $4)
            "##,
        )
        .bind(self.id)
        .bind(&self.name)
        .bind(self.owner_id)
        .bind(&self.secret)
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
                INSERT INTO "User" ("id", "name", "category")
                VALUES ($1, $2, 'BOT')
                RETURNING "id"
            )
            INSERT INTO "Bot" ("id", "name", "ownerId", "secret")
            VALUES ((SELECT "id" FROM u), $3, $4, $5)
            "##,
        )
        .bind(self.id)
        .bind(name)
        .bind(&self.name)
        .bind(self.owner_id)
        .bind(&self.secret)
        .execute(db)
        .await?;
        Ok(())
    }

    pub async fn delete<'c, X: sqlx::PgExecutor<'c>>(id: Uuid, db: X) -> Result<(), Error> {
        sqlx::query(r#"DELETE FROM "Bot" WHERE "id" = $1"#)
            .bind(id)
            .execute(db)
            .await?;
        Ok(())
    }
}
