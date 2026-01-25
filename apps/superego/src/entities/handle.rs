use chrono::NaiveDateTime;
use regex::Regex;
use schemars::JsonSchema;
use serde_json::Value as JsonValue;
use std::sync::LazyLock;
use uuid::Uuid;

use crate::{entity, env::env, error::Error, model};

/// Regex for validating the username portion of a default handle
/// (e.g., "hayley" in "hayley.mikoto.io")
static USERNAME_REGEX: LazyLock<Regex> = LazyLock::new(|| {
    Regex::new(r"^[a-z0-9][a-z0-9_-]*[a-z0-9]$|^[a-z0-9]$").expect("invalid regex")
});

/// Regex for validating a domain name (custom handle)
static DOMAIN_REGEX: LazyLock<Regex> = LazyLock::new(|| {
    Regex::new(r"^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$").expect("invalid regex")
});

entity!(
    pub struct Handle {
        pub handle: String,
        pub user_id: Option<Uuid>,
        pub space_id: Option<Uuid>,
        pub verified_at: Option<NaiveDateTime>,
        pub attestation: Option<JsonValue>,
        pub created_at: NaiveDateTime,
    }
);

/// Attestation stored in the database for verified custom domains
model!(
    pub struct HandleAttestation {
        pub handle: String,
        pub entity_type: String, // "user" or "space"
        pub entity_id: Uuid,
        pub instance: String,
        pub verified_at: String,
        pub dns_record_hash: Option<String>,
        pub signature: String,
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
    pub verified_at: Option<NaiveDateTime>,
    pub created_at: NaiveDateTime,
}

impl Handle {
    /// Check if a handle is a default handle (subdomain of the instance domain)
    pub fn is_default_handle(handle: &str) -> bool {
        let domain = &env().handle.domain;
        handle.ends_with(&format!(".{}", domain))
    }

    /// Extract the username from a default handle
    /// e.g., "hayley.mikoto.io" -> Some("hayley")
    pub fn extract_username(handle: &str) -> Option<&str> {
        let domain = &env().handle.domain;
        let suffix = format!(".{}", domain);
        handle.strip_suffix(&suffix)
    }

    /// Create a default handle from a username
    /// e.g., "hayley" -> "hayley.mikoto.io"
    pub fn make_default_handle(username: &str) -> String {
        format!("{}.{}", username, env().handle.domain)
    }

    /// Validate a username (the portion before the instance domain)
    pub fn validate_username(username: &str) -> Result<(), Error> {
        // Length check: 2-64 characters
        if username.len() < 2 || username.len() > 64 {
            return Err(Error::new(
                "InvalidHandle",
                axum::http::StatusCode::BAD_REQUEST,
                "Username must be between 2 and 64 characters",
            ));
        }

        // Must be lowercase
        if username != username.to_lowercase() {
            return Err(Error::new(
                "InvalidHandle",
                axum::http::StatusCode::BAD_REQUEST,
                "Username must be lowercase",
            ));
        }

        // Pattern check: alphanumeric + hyphens/underscores, cannot start/end with hyphen or underscore
        if !USERNAME_REGEX.is_match(username) {
            return Err(Error::new(
                "InvalidHandle",
                axum::http::StatusCode::BAD_REQUEST,
                "Username must contain only lowercase letters, numbers, hyphens, and underscores, and cannot start or end with a hyphen or underscore",
            ));
        }

        Ok(())
    }

    /// Validate a custom domain handle
    pub fn validate_custom_domain(domain: &str) -> Result<(), Error> {
        // Max domain length
        if domain.len() > 253 {
            return Err(Error::new(
                "InvalidHandle",
                axum::http::StatusCode::BAD_REQUEST,
                "Domain name is too long",
            ));
        }

        // Must be lowercase
        if domain != domain.to_lowercase() {
            return Err(Error::new(
                "InvalidHandle",
                axum::http::StatusCode::BAD_REQUEST,
                "Domain must be lowercase",
            ));
        }

        // Check if it's a valid domain name format
        if !DOMAIN_REGEX.is_match(domain) {
            return Err(Error::new(
                "InvalidHandle",
                axum::http::StatusCode::BAD_REQUEST,
                "Invalid domain format. Must be a valid domain name without protocol or path",
            ));
        }

        // Cannot be a subdomain of the instance handle domain (use default handles for that)
        let handle_domain = &env().handle.domain;
        if domain.ends_with(&format!(".{}", handle_domain)) || domain == handle_domain.as_str() {
            return Err(Error::new(
                "InvalidHandle",
                axum::http::StatusCode::BAD_REQUEST,
                "Cannot use a subdomain of the instance domain as a custom handle. Use a default handle instead.",
            ));
        }

        Ok(())
    }

    /// Validate a handle string (either default or custom domain)
    pub fn validate(handle: &str) -> Result<(), Error> {
        if Self::is_default_handle(handle) {
            // For default handles, validate the username portion
            if let Some(username) = Self::extract_username(handle) {
                Self::validate_username(username)
            } else {
                Err(Error::new(
                    "InvalidHandle",
                    axum::http::StatusCode::BAD_REQUEST,
                    "Invalid default handle format",
                ))
            }
        } else {
            // For custom handles, validate as domain
            Self::validate_custom_domain(handle)
        }
    }

    /// Whether this handle is verified (custom domain that passed verification)
    pub fn is_verified(&self) -> bool {
        self.verified_at.is_some()
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
            verified_at: self.verified_at,
            created_at: self.created_at,
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_valid_usernames() {
        assert!(Handle::validate_username("rust-lang").is_ok());
        assert!(Handle::validate_username("user123").is_ok());
        assert!(Handle::validate_username("my_handle").is_ok());
        assert!(Handle::validate_username("a1").is_ok());
        assert!(Handle::validate_username("test-user_123").is_ok());
    }

    #[test]
    fn test_invalid_usernames() {
        // Too short
        assert!(Handle::validate_username("a").is_err());

        // Starts with hyphen
        assert!(Handle::validate_username("-user").is_err());

        // Ends with underscore
        assert!(Handle::validate_username("user_").is_err());

        // Contains uppercase
        assert!(Handle::validate_username("User").is_err());

        // Contains invalid characters
        assert!(Handle::validate_username("user@name").is_err());
    }

    #[test]
    fn test_valid_custom_domains() {
        assert!(Handle::validate_custom_domain("hayley.moe").is_ok());
        assert!(Handle::validate_custom_domain("rust-lang.org").is_ok());
        assert!(Handle::validate_custom_domain("example.co.uk").is_ok());
        assert!(Handle::validate_custom_domain("a1.com").is_ok());
    }

    #[test]
    fn test_invalid_custom_domains() {
        // No TLD
        assert!(Handle::validate_custom_domain("example").is_err());

        // Contains uppercase
        assert!(Handle::validate_custom_domain("Example.com").is_err());

        // Invalid characters
        assert!(Handle::validate_custom_domain("example@.com").is_err());

        // Just TLD
        assert!(Handle::validate_custom_domain(".com").is_err());
    }
}
