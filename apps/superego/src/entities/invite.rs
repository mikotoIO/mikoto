use uuid::Uuid;

use crate::{entity, error::Error, functions::time::Timestamp};

entity!(
    pub struct Invite {
        pub id: String, // Not UUID, but a NanoID
        pub space_id: Uuid,
        pub created_at: Timestamp,
        pub creator_id: Uuid,
    }
);

impl Invite {
    // can't use db_find_by_id because the id is a string
    pub async fn find_by_id<'c, X: sqlx::PgExecutor<'c>>(id: &str, db: X) -> Result<Self, Error> {
        let res = sqlx::query_as(
            r#"
            SELECT * FROM "Invite" WHERE "id" = $1
            "#,
        )
        .bind(id)
        .fetch_optional(db)
        .await?
        .ok_or(Error::NotFound)?;
        Ok(res)
    }

    pub async fn list_by_space_id<'c, X: sqlx::PgExecutor<'c>>(
        id: Uuid,
        db: X,
    ) -> Result<Vec<Self>, Error> {
        let res = sqlx::query_as(
            r#"
            SELECT * FROM "Invite" WHERE "spaceId" = $1
            "#,
        )
        .bind(id)
        .fetch_all(db)
        .await?;
        Ok(res)
    }

    pub async fn create<'c, X: sqlx::PgExecutor<'c>>(&self, db: X) -> Result<(), Error> {
        sqlx::query(
            r#"
            INSERT INTO "Invite" ("id", "spaceId", "createdAt", "creatorId")
            VALUES ($1, $2, $3, $4)
            "#,
        )
        .bind(&self.id)
        .bind(self.space_id)
        .bind(self.created_at)
        .bind(self.creator_id)
        .execute(db)
        .await?;
        Ok(())
    }

    pub async fn delete<'c, X: sqlx::PgExecutor<'c>>(id: &str, db: X) -> Result<(), Error> {
        sqlx::query(
            r#"
            DELETE FROM "Invite" WHERE "id" = $1
            "#,
        )
        .bind(id)
        .execute(db)
        .await?;
        Ok(())
    }
}
