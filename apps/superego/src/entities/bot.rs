use uuid::Uuid;

use crate::{entity, error::Error};

entity!(
    pub struct Bot {
        pub id: Uuid,
        pub name: String,
        pub owner_id: Uuid,

        pub secret: String,
    }
);

impl Bot {
    pub async fn list<'c, X: sqlx::PgExecutor<'c>>(
        owner_id: Uuid,
        db: X,
    ) -> Result<Vec<Self>, Error> {
        let bots = sqlx::query_as(r#"SELECT * FROM "Bots" WHERE "ownerId" = $1"#)
            .bind(owner_id)
            .fetch_all(db)
            .await?;
        Ok(bots)
    }

    pub async fn create<'c, X: sqlx::PgExecutor<'c>>(&self, db: X) -> Result<(), Error> {
        sqlx::query(
            r##"
            INSERT INTO "Bots" ("id", "name", "ownerId", "secret")
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
            INSERT INTO "Bots" ("id", "name", "ownerId", "secret")
            VALUES ((SELECT "id" FROM u), $3, $4, $5)
            "##,
        )
        .bind(self.owner_id)
        .bind(name)
        .bind(&self.name)
        .bind(self.owner_id)
        .bind(&self.secret)
        .execute(db)
        .await?;
        Ok(())
    }

    pub async fn delete<'c, X: sqlx::PgExecutor<'c>>(id: Uuid, db: X) -> Result<(), Error> {
        sqlx::query(r#"DELETE FROM "Bots" WHERE "id" = $1"#)
            .bind(id)
            .execute(db)
            .await?;
        Ok(())
    }
}
