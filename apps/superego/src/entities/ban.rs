use uuid::Uuid;

use crate::{entity, error::Error};

entity!(
    pub struct Ban {
        pub id: Uuid,
        pub user_id: Uuid,
        pub space_id: Uuid,
        pub reason: Option<String>,
    }
);

impl Ban {
    pub async fn create<'c, X: sqlx::PgExecutor<'c>>(&self, db: X) -> Result<(), Error> {
        sqlx::query(
            r#"
            INSERT INTO "Ban" ("id", "userId", "spaceId", "reason")
            VALUES ($1, $2, $3, $4)
            "#,
        )
        .bind(self.id)
        .bind(self.user_id)
        .bind(self.space_id)
        .bind(&self.reason)
        .execute(db)
        .await?;
        Ok(())
    }

    pub async fn find_by_space_and_user<'c, X: sqlx::PgExecutor<'c>>(
        space_id: Uuid,
        user_id: Uuid,
        db: X,
    ) -> Result<Option<Self>, Error> {
        let ban = sqlx::query_as(
            r#"
            SELECT * FROM "Ban" WHERE "spaceId" = $1 AND "userId" = $2
            "#,
        )
        .bind(space_id)
        .bind(user_id)
        .fetch_optional(db)
        .await?;
        Ok(ban)
    }

    pub async fn delete<'c, X: sqlx::PgExecutor<'c>>(id: Uuid, db: X) -> Result<(), Error> {
        sqlx::query(r#"DELETE FROM "Ban" WHERE "id" = $1"#)
            .bind(id)
            .execute(db)
            .await?;
        Ok(())
    }
}
