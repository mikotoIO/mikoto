use chrono::{DateTime, Utc};
use uuid::Uuid;

use crate::{entity, error::Error};

entity!(
    pub struct VerifiedHandle {
        pub id: Uuid,
        pub user_id: Uuid,
        pub handle: String,
        pub public_key: String,
        pub verified_at: DateTime<Utc>,
    }
);

impl VerifiedHandle {
    pub async fn create<'c, X: sqlx::PgExecutor<'c>>(
        user_id: Uuid,
        handle: &str,
        public_key: &str,
        db: X,
    ) -> Result<Self, Error> {
        let result = sqlx::query_as(
            r#"
            INSERT INTO "VerifiedHandle" ("userId", handle, "publicKey")
            VALUES ($1, $2, $3)
            ON CONFLICT ("userId", handle) DO UPDATE
            SET "publicKey" = $3, "verifiedAt" = CURRENT_TIMESTAMP
            RETURNING *
            "#,
        )
        .bind(user_id)
        .bind(handle)
        .bind(public_key)
        .fetch_one(db)
        .await?;

        Ok(result)
    }

    pub async fn get_by_user<'c, X: sqlx::PgExecutor<'c>>(
        user_id: Uuid,
        db: X,
    ) -> Result<Vec<Self>, Error> {
        let handles = sqlx::query_as(
            r#"
            SELECT * FROM "VerifiedHandle"
            WHERE "userId" = $1
            ORDER BY "verifiedAt" DESC
            "#,
        )
        .bind(user_id)
        .fetch_all(db)
        .await?;

        Ok(handles)
    }

    pub async fn get_by_handle<'c, X: sqlx::PgExecutor<'c>>(
        user_id: Uuid,
        handle: &str,
        db: X,
    ) -> Result<Option<Self>, Error> {
        let result = sqlx::query_as(
            r#"
            SELECT * FROM "VerifiedHandle"
            WHERE "userId" = $1 AND handle = $2
            "#,
        )
        .bind(user_id)
        .bind(handle)
        .fetch_optional(db)
        .await?;

        Ok(result)
    }

    pub async fn delete<'c, X: sqlx::PgExecutor<'c>>(
        user_id: Uuid,
        handle: &str,
        db: X,
    ) -> Result<(), Error> {
        sqlx::query(
            r#"
            DELETE FROM "VerifiedHandle"
            WHERE "userId" = $1 AND handle = $2
            "#,
        )
        .bind(user_id)
        .bind(handle)
        .execute(db)
        .await?;

        Ok(())
    }
}

entity!(
    pub struct HandleVerificationRequest {
        pub id: Uuid,
        pub user_id: Uuid,
        pub handle: String,
        pub challenge: String,
        pub request_id: Option<String>,
        pub expires_at: DateTime<Utc>,
        pub created_at: DateTime<Utc>,
        pub status: String,
    }
);

impl HandleVerificationRequest {
    pub async fn create<'c, X: sqlx::PgExecutor<'c>>(
        user_id: Uuid,
        handle: &str,
        challenge: &str,
        expires_at: DateTime<Utc>,
        request_id: Option<String>,
        db: X,
    ) -> Result<Self, Error> {
        let request = sqlx::query_as(
            r#"
            INSERT INTO "HandleVerificationRequest" ("userId", handle, challenge, "expiresAt", "requestId")
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
            "#,
        )
        .bind(user_id)
        .bind(handle)
        .bind(challenge)
        .bind(expires_at)
        .bind(request_id)
        .fetch_one(db)
        .await?;

        Ok(request)
    }

    pub async fn get_by_id<'c, X: sqlx::PgExecutor<'c>>(
        id: Uuid,
        db: X,
    ) -> Result<Option<Self>, Error> {
        let request = sqlx::query_as(
            r#"
            SELECT * FROM "HandleVerificationRequest"
            WHERE id = $1
            "#,
        )
        .bind(id)
        .fetch_optional(db)
        .await?;

        Ok(request)
    }

    pub async fn get_pending_by_user<'c, X: sqlx::PgExecutor<'c>>(
        user_id: Uuid,
        db: X,
    ) -> Result<Vec<Self>, Error> {
        let requests = sqlx::query_as(
            r#"
            SELECT * FROM "HandleVerificationRequest"
            WHERE "userId" = $1 AND status = 'pending' AND "expiresAt" > CURRENT_TIMESTAMP
            ORDER BY "createdAt" DESC
            "#,
        )
        .bind(user_id)
        .fetch_all(db)
        .await?;

        Ok(requests)
    }

    pub async fn update_status<'c, X: sqlx::PgExecutor<'c>>(
        id: Uuid,
        status: &str,
        db: X,
    ) -> Result<(), Error> {
        sqlx::query(
            r#"
            UPDATE "HandleVerificationRequest"
            SET status = $2
            WHERE id = $1
            "#,
        )
        .bind(id)
        .bind(status)
        .execute(db)
        .await?;

        Ok(())
    }

    pub async fn cleanup_expired<'c, X: sqlx::PgExecutor<'c>>(db: X) -> Result<u64, Error> {
        let result = sqlx::query(
            r#"
            DELETE FROM "HandleVerificationRequest"
            WHERE "expiresAt" < CURRENT_TIMESTAMP AND status = 'pending'
            "#,
        )
        .execute(db)
        .await?;

        Ok(result.rows_affected())
    }
}
