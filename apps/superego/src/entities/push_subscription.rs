use chrono::NaiveDateTime;
use uuid::Uuid;

use crate::{entity, error::Error};

entity!(
    pub struct PushSubscription {
        pub id: Uuid,
        pub user_id: Uuid,
        pub endpoint: String,
        pub p256dh: String,
        pub auth: String,
        pub created_at: NaiveDateTime,
    }
);

impl PushSubscription {
    pub async fn upsert<'c, X: sqlx::PgExecutor<'c>>(
        user_id: Uuid,
        endpoint: &str,
        p256dh: &str,
        auth: &str,
        db: X,
    ) -> Result<Self, Error> {
        let sub = sqlx::query_as(
            r##"
            INSERT INTO "PushSubscription" ("userId", "endpoint", "p256dh", "auth")
            VALUES ($1, $2, $3, $4)
            ON CONFLICT ("endpoint")
            DO UPDATE SET "userId" = $1, "p256dh" = $3, "auth" = $4
            RETURNING *
            "##,
        )
        .bind(user_id)
        .bind(endpoint)
        .bind(p256dh)
        .bind(auth)
        .fetch_one(db)
        .await?;
        Ok(sub)
    }

    pub async fn delete_by_endpoint<'c, X: sqlx::PgExecutor<'c>>(
        user_id: Uuid,
        endpoint: &str,
        db: X,
    ) -> Result<(), Error> {
        sqlx::query(
            r##"
            DELETE FROM "PushSubscription"
            WHERE "userId" = $1 AND "endpoint" = $2
            "##,
        )
        .bind(user_id)
        .bind(endpoint)
        .execute(db)
        .await?;
        Ok(())
    }

    pub async fn list_by_user<'c, X: sqlx::PgExecutor<'c>>(
        user_id: Uuid,
        db: X,
    ) -> Result<Vec<Self>, Error> {
        let subs = sqlx::query_as(
            r##"
            SELECT * FROM "PushSubscription" WHERE "userId" = $1
            "##,
        )
        .bind(user_id)
        .fetch_all(db)
        .await?;
        Ok(subs)
    }

    pub async fn delete_by_id<'c, X: sqlx::PgExecutor<'c>>(id: Uuid, db: X) -> Result<(), Error> {
        sqlx::query(r##"DELETE FROM "PushSubscription" WHERE "id" = $1"##)
            .bind(id)
            .execute(db)
            .await?;
        Ok(())
    }
}
