use chrono::{DateTime, Utc};
use uuid::Uuid;

use crate::{entity, error::Error};

entity!(
    pub struct VerifiedDomain {
        pub id: Uuid,
        pub user_id: Uuid,
        pub domain: String,
        pub public_key: String,
        pub verified_at: DateTime<Utc>,
    }
);

impl VerifiedDomain {
    pub async fn create<'c, X: sqlx::PgExecutor<'c>>(
        user_id: Uuid,
        domain: &str,
        public_key: &str,
        db: X,
    ) -> Result<Self, Error> {
        let result = sqlx::query_as(
            r#"
            INSERT INTO "VerifiedDomain" ("userId", domain, "publicKey")
            VALUES ($1, $2, $3)
            ON CONFLICT ("userId", domain) DO UPDATE
            SET "publicKey" = $3, "verifiedAt" = CURRENT_TIMESTAMP
            RETURNING *
            "#,
        )
        .bind(user_id)
        .bind(domain)
        .bind(public_key)
        .fetch_one(db)
        .await?;

        Ok(result)
    }

    pub async fn get_by_user<'c, X: sqlx::PgExecutor<'c>>(
        user_id: Uuid,
        db: X,
    ) -> Result<Vec<Self>, Error> {
        let domains = sqlx::query_as(
            r#"
            SELECT * FROM "VerifiedDomain"
            WHERE "userId" = $1
            ORDER BY "verifiedAt" DESC
            "#,
        )
        .bind(user_id)
        .fetch_all(db)
        .await?;

        Ok(domains)
    }

    pub async fn get_by_domain<'c, X: sqlx::PgExecutor<'c>>(
        user_id: Uuid,
        domain: &str,
        db: X,
    ) -> Result<Option<Self>, Error> {
        let result = sqlx::query_as(
            r#"
            SELECT * FROM "VerifiedDomain"
            WHERE "userId" = $1 AND domain = $2
            "#,
        )
        .bind(user_id)
        .bind(domain)
        .fetch_optional(db)
        .await?;

        Ok(result)
    }

    pub async fn delete<'c, X: sqlx::PgExecutor<'c>>(
        user_id: Uuid,
        domain: &str,
        db: X,
    ) -> Result<(), Error> {
        sqlx::query(
            r#"
            DELETE FROM "VerifiedDomain"
            WHERE "userId" = $1 AND domain = $2
            "#,
        )
        .bind(user_id)
        .bind(domain)
        .execute(db)
        .await?;

        Ok(())
    }
}

entity!(
    pub struct DomainVerificationRequest {
        pub id: Uuid,
        pub user_id: Uuid,
        pub domain: String,
        pub challenge: String,
        pub request_id: Option<String>,
        pub expires_at: DateTime<Utc>,
        pub created_at: DateTime<Utc>,
        pub status: String,
    }
);

impl DomainVerificationRequest {
    pub async fn create<'c, X: sqlx::PgExecutor<'c>>(
        user_id: Uuid,
        domain: &str,
        challenge: &str,
        expires_at: DateTime<Utc>,
        request_id: Option<String>,
        db: X,
    ) -> Result<Self, Error> {
        let request = sqlx::query_as(
            r#"
            INSERT INTO "DomainVerificationRequest" ("userId", domain, challenge, "expiresAt", "requestId")
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
            "#,
        )
        .bind(user_id)
        .bind(domain)
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
            SELECT * FROM "DomainVerificationRequest"
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
            SELECT * FROM "DomainVerificationRequest"
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
            UPDATE "DomainVerificationRequest"
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
            DELETE FROM "DomainVerificationRequest"
            WHERE "expiresAt" < CURRENT_TIMESTAMP AND status = 'pending'
            "#
        )
        .execute(db)
        .await?;

        Ok(result.rows_affected())
    }
}
