use chrono::NaiveDateTime;
use regex::Regex;
use std::sync::LazyLock;
use schemars::JsonSchema;
use uuid::Uuid;

use crate::{entity, error::Error};

/// Reserved handles that cannot be claimed
const RESERVED_HANDLES: &[&str] = &[
    "admin",
    "administrator",
    "api",
    "app",
    "auth",
    "bot",
    "bots",
    "cdn",
    "channel",
    "channels",
    "collab",
    "docs",
    "help",
    "home",
    "invite",
    "invites",
    "login",
    "logout",
    "me",
    "member",
    "members",
    "mikoto",
    "mod",
    "moderator",
    "null",
    "register",
    "role",
    "roles",
    "root",
    "search",
    "settings",
    "space",
    "spaces",
    "support",
    "system",
    "undefined",
    "user",
    "users",
    "voice",
    "ws",
];

static HANDLE_REGEX: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r"^[a-z0-9][a-z0-9_-]*[a-z0-9]$|^[a-z0-9]$").expect("invalid regex"));

entity!(
    pub struct Handle {
        pub handle: String,
        pub user_id: Option<Uuid>,
        pub space_id: Option<Uuid>,
        pub created_at: NaiveDateTime,
    }
);

/// Represents what entity type owns a handle
#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
#[serde(tag = "type", rename_all = "camelCase")]
pub enum HandleOwner {
    User { id: Uuid },
    Space { id: Uuid },
}

/// Response for handle resolution
#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
#[serde(rename_all = "camelCase")]
pub struct HandleResolution {
    pub handle: String,
    pub owner: HandleOwner,
    pub created_at: NaiveDateTime,
}

impl Handle {
    /// Validate a handle string
    pub fn validate(handle: &str) -> Result<(), Error> {
        // Length check: 3-64 characters (single char handled by regex)
        if handle.len() < 2 || handle.len() > 64 {
            return Err(Error::new(
                "InvalidHandle",
                axum::http::StatusCode::BAD_REQUEST,
                "Handle must be between 2 and 64 characters",
            ));
        }

        // Must be lowercase
        if handle != handle.to_lowercase() {
            return Err(Error::new(
                "InvalidHandle",
                axum::http::StatusCode::BAD_REQUEST,
                "Handle must be lowercase",
            ));
        }

        // Pattern check: alphanumeric + hyphens/underscores, cannot start/end with hyphen or underscore
        if !HANDLE_REGEX.is_match(handle) {
            return Err(Error::new(
                "InvalidHandle",
                axum::http::StatusCode::BAD_REQUEST,
                "Handle must contain only lowercase letters, numbers, hyphens, and underscores, and cannot start or end with a hyphen or underscore",
            ));
        }

        // Reserved words check
        if RESERVED_HANDLES.contains(&handle) {
            return Err(Error::new(
                "ReservedHandle",
                axum::http::StatusCode::BAD_REQUEST,
                "This handle is reserved and cannot be used",
            ));
        }

        Ok(())
    }

    /// Claim a handle for a user
    pub async fn claim_for_user<'c, X: sqlx::PgExecutor<'c>>(
        handle: String,
        user_id: Uuid,
        db: X,
    ) -> Result<Self, Error> {
        Self::validate(&handle)?;

        let result: Self = sqlx::query_as(
            r#"
            INSERT INTO "Handle" (handle, "userId")
            VALUES ($1, $2)
            RETURNING *
            "#,
        )
        .bind(&handle)
        .bind(user_id)
        .fetch_one(db)
        .await
        .map_err(|e| match e {
            sqlx::Error::Database(ref db_err) if db_err.is_unique_violation() => Error::new(
                "HandleTaken",
                axum::http::StatusCode::CONFLICT,
                "This handle is already taken",
            ),
            _ => Error::from(e),
        })?;

        Ok(result)
    }

    /// Claim a handle for a space
    pub async fn claim_for_space<'c, X: sqlx::PgExecutor<'c>>(
        handle: String,
        space_id: Uuid,
        db: X,
    ) -> Result<Self, Error> {
        Self::validate(&handle)?;

        let result: Self = sqlx::query_as(
            r#"
            INSERT INTO "Handle" (handle, "spaceId")
            VALUES ($1, $2)
            RETURNING *
            "#,
        )
        .bind(&handle)
        .bind(space_id)
        .fetch_one(db)
        .await
        .map_err(|e| match e {
            sqlx::Error::Database(ref db_err) if db_err.is_unique_violation() => Error::new(
                "HandleTaken",
                axum::http::StatusCode::CONFLICT,
                "This handle is already taken",
            ),
            _ => Error::from(e),
        })?;

        Ok(result)
    }

    /// Release a user's handle and claim a new one (atomic operation)
    pub async fn change_user_handle<'c, X: sqlx::PgExecutor<'c>>(
        user_id: Uuid,
        new_handle: String,
        db: X,
    ) -> Result<Self, Error> {
        Self::validate(&new_handle)?;

        let result: Self = sqlx::query_as(
            r#"
            WITH deleted AS (
                DELETE FROM "Handle" WHERE "userId" = $1
            )
            INSERT INTO "Handle" (handle, "userId")
            VALUES ($2, $1)
            RETURNING *
            "#,
        )
        .bind(user_id)
        .bind(&new_handle)
        .fetch_one(db)
        .await
        .map_err(|e| match e {
            sqlx::Error::Database(ref db_err) if db_err.is_unique_violation() => Error::new(
                "HandleTaken",
                axum::http::StatusCode::CONFLICT,
                "This handle is already taken",
            ),
            _ => Error::from(e),
        })?;

        Ok(result)
    }

    /// Release a space's handle and claim a new one (atomic operation)
    pub async fn change_space_handle<'c, X: sqlx::PgExecutor<'c>>(
        space_id: Uuid,
        new_handle: String,
        db: X,
    ) -> Result<Self, Error> {
        Self::validate(&new_handle)?;

        let result: Self = sqlx::query_as(
            r#"
            WITH deleted AS (
                DELETE FROM "Handle" WHERE "spaceId" = $1
            )
            INSERT INTO "Handle" (handle, "spaceId")
            VALUES ($2, $1)
            RETURNING *
            "#,
        )
        .bind(space_id)
        .bind(&new_handle)
        .fetch_one(db)
        .await
        .map_err(|e| match e {
            sqlx::Error::Database(ref db_err) if db_err.is_unique_violation() => Error::new(
                "HandleTaken",
                axum::http::StatusCode::CONFLICT,
                "This handle is already taken",
            ),
            _ => Error::from(e),
        })?;

        Ok(result)
    }

    /// Resolve a handle to its owner
    pub async fn resolve<'c, X: sqlx::PgExecutor<'c>>(
        handle: &str,
        db: X,
    ) -> Result<Option<Self>, Error> {
        let result: Option<Self> = sqlx::query_as(
            r#"
            SELECT * FROM "Handle" WHERE handle = $1
            "#,
        )
        .bind(handle)
        .fetch_optional(db)
        .await?;

        Ok(result)
    }

    /// Get the handle for a user (if they have one)
    pub async fn for_user<'c, X: sqlx::PgExecutor<'c>>(
        user_id: Uuid,
        db: X,
    ) -> Result<Option<Self>, Error> {
        let result: Option<Self> = sqlx::query_as(
            r#"
            SELECT * FROM "Handle" WHERE "userId" = $1
            "#,
        )
        .bind(user_id)
        .fetch_optional(db)
        .await?;

        Ok(result)
    }

    /// Get the handle for a space (if it has one)
    pub async fn for_space<'c, X: sqlx::PgExecutor<'c>>(
        space_id: Uuid,
        db: X,
    ) -> Result<Option<Self>, Error> {
        let result: Option<Self> = sqlx::query_as(
            r#"
            SELECT * FROM "Handle" WHERE "spaceId" = $1
            "#,
        )
        .bind(space_id)
        .fetch_optional(db)
        .await?;

        Ok(result)
    }

    /// Release a user's handle
    pub async fn release_for_user<'c, X: sqlx::PgExecutor<'c>>(
        user_id: Uuid,
        db: X,
    ) -> Result<bool, Error> {
        let result = sqlx::query(
            r#"
            DELETE FROM "Handle" WHERE "userId" = $1
            "#,
        )
        .bind(user_id)
        .execute(db)
        .await?;

        Ok(result.rows_affected() > 0)
    }

    /// Release a space's handle
    pub async fn release_for_space<'c, X: sqlx::PgExecutor<'c>>(
        space_id: Uuid,
        db: X,
    ) -> Result<bool, Error> {
        let result = sqlx::query(
            r#"
            DELETE FROM "Handle" WHERE "spaceId" = $1
            "#,
        )
        .bind(space_id)
        .execute(db)
        .await?;

        Ok(result.rows_affected() > 0)
    }

    /// Batch load handles for multiple users
    pub async fn for_users<'c, X: sqlx::PgExecutor<'c>>(
        user_ids: &[Uuid],
        db: X,
    ) -> Result<std::collections::HashMap<Uuid, String>, Error> {
        let handles: Vec<Self> = sqlx::query_as(
            r#"
            SELECT * FROM "Handle" WHERE "userId" = ANY($1)
            "#,
        )
        .bind(user_ids)
        .fetch_all(db)
        .await?;

        Ok(handles
            .into_iter()
            .filter_map(|h| h.user_id.map(|uid| (uid, h.handle)))
            .collect())
    }

    /// Batch load handles for multiple spaces
    pub async fn for_spaces<'c, X: sqlx::PgExecutor<'c>>(
        space_ids: &[Uuid],
        db: X,
    ) -> Result<std::collections::HashMap<Uuid, String>, Error> {
        let handles: Vec<Self> = sqlx::query_as(
            r#"
            SELECT * FROM "Handle" WHERE "spaceId" = ANY($1)
            "#,
        )
        .bind(space_ids)
        .fetch_all(db)
        .await?;

        Ok(handles
            .into_iter()
            .filter_map(|h| h.space_id.map(|sid| (sid, h.handle)))
            .collect())
    }

    /// Convert to resolution response
    pub fn to_resolution(&self) -> Option<HandleResolution> {
        let owner = match (self.user_id, self.space_id) {
            (Some(uid), None) => HandleOwner::User { id: uid },
            (None, Some(sid)) => HandleOwner::Space { id: sid },
            _ => return None,
        };

        Some(HandleResolution {
            handle: self.handle.clone(),
            owner,
            created_at: self.created_at,
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_valid_handles() {
        assert!(Handle::validate("rust-lang").is_ok());
        assert!(Handle::validate("user123").is_ok());
        assert!(Handle::validate("my_handle").is_ok());
        assert!(Handle::validate("a1").is_ok());
        assert!(Handle::validate("test-user_123").is_ok());
    }

    #[test]
    fn test_invalid_handles() {
        // Too short
        assert!(Handle::validate("a").is_err());

        // Starts with hyphen
        assert!(Handle::validate("-user").is_err());

        // Ends with underscore
        assert!(Handle::validate("user_").is_err());

        // Contains uppercase
        assert!(Handle::validate("User").is_err());

        // Contains invalid characters
        assert!(Handle::validate("user@name").is_err());

        // Reserved
        assert!(Handle::validate("admin").is_err());
        assert!(Handle::validate("api").is_err());
    }
}
