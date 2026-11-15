use std::{collections::HashMap, sync::LazyLock};

use regex::Regex;
use schemars::JsonSchema;
use uuid::Uuid;

use crate::{db_entity_delete, db_find_by_id, entity, error::Error};

use super::group_by_key;

/// The most custom emoji a single space may have.
pub const MAX_EMOJIS_PER_SPACE: i64 = 200;

entity!(
    /// A custom emoji, uploaded to a space. Members write it as `:name:`.
    pub struct Emoji {
        pub id: Uuid,
        pub space_id: Uuid,
        pub name: String,
        /// Media server path of the image (e.g. `emoji/abc123.png`).
        pub image: String,
        pub creator_id: Option<Uuid>,
    }
);

#[derive(Deserialize, JsonSchema)]
#[serde(rename_all = "camelCase")]
pub struct EmojiCreatePayload {
    /// 2-32 letters, digits or underscores.
    pub name: String,
    /// The `url` the media server returned for an upload to its `emoji` store.
    pub image: String,
}

#[derive(Deserialize, JsonSchema)]
#[serde(rename_all = "camelCase")]
pub struct EmojiPatch {
    pub name: String,
}

fn invalid(code: &str, message: &str) -> Error {
    Error::new(code, axum::http::StatusCode::BAD_REQUEST, message)
}

/// Emoji names: 2-32 ASCII letters, digits or underscores.
pub fn validate_emoji_name(name: &str) -> Result<(), Error> {
    // A constant pattern, known to compile.
    static RE: LazyLock<Regex> = LazyLock::new(|| Regex::new(r"^[A-Za-z0-9_]{2,32}$").unwrap());
    if RE.is_match(name) {
        Ok(())
    } else {
        Err(invalid(
            "InvalidEmojiName",
            "Emoji names must be 2-32 letters, numbers or underscores",
        ))
    }
}

/// Emoji images must be uploads to the media server's `emoji` store, so a
/// message can't make every reader fetch an arbitrary URL.
pub fn validate_emoji_image(image: &str) -> Result<(), Error> {
    // A constant pattern, known to compile.
    static RE: LazyLock<Regex> =
        LazyLock::new(|| Regex::new(r"^emoji/[A-Za-z0-9_-]{1,64}\.(png|gif|webp|jpg)$").unwrap());
    if RE.is_match(image) {
        Ok(())
    } else {
        Err(invalid(
            "InvalidEmojiImage",
            "Emoji images must be uploaded to the emoji store",
        ))
    }
}

fn map_unique_violation(err: sqlx::Error) -> Error {
    if let sqlx::Error::Database(db_err) = &err {
        if db_err.is_unique_violation() {
            return Error::new(
                "EmojiNameTaken",
                axum::http::StatusCode::CONFLICT,
                "This space already has an emoji with that name",
            );
        }
    }
    err.into()
}

impl Emoji {
    db_find_by_id!("Emoji");

    pub async fn list<'c, X: sqlx::PgExecutor<'c>>(
        space_id: Uuid,
        db: X,
    ) -> Result<Vec<Self>, Error> {
        let xs = sqlx::query_as(
            r#"SELECT * FROM "Emoji" WHERE "spaceId" = $1 ORDER BY "createdAt", "id""#,
        )
        .bind(space_id)
        .fetch_all(db)
        .await?;
        Ok(xs)
    }
    db_entity_delete!("Emoji");

    pub async fn dataload_space<'c, X: sqlx::PgExecutor<'c>>(
        space_ids: Vec<Uuid>,
        db: X,
    ) -> Result<HashMap<Uuid, Vec<Self>>, Error> {
        let xs: Vec<Self> = sqlx::query_as(
            r#"SELECT * FROM "Emoji" WHERE "spaceId" = ANY($1) ORDER BY "createdAt", "id""#,
        )
        .bind(&space_ids)
        .fetch_all(db)
        .await?;
        Ok(group_by_key(xs, |x| x.space_id))
    }

    pub async fn count_in_space<'c, X: sqlx::PgExecutor<'c>>(
        space_id: Uuid,
        db: X,
    ) -> Result<i64, Error> {
        let row: (i64,) = sqlx::query_as(r#"SELECT COUNT(*) FROM "Emoji" WHERE "spaceId" = $1"#)
            .bind(space_id)
            .fetch_one(db)
            .await?;
        Ok(row.0)
    }

    pub async fn create<'c, X: sqlx::PgExecutor<'c>>(&self, db: X) -> Result<(), Error> {
        sqlx::query(
            r#"
            INSERT INTO "Emoji" ("id", "spaceId", "name", "image", "creatorId")
            VALUES ($1, $2, $3, $4, $5)
            "#,
        )
        .bind(self.id)
        .bind(self.space_id)
        .bind(&self.name)
        .bind(&self.image)
        .bind(self.creator_id)
        .execute(db)
        .await
        .map_err(map_unique_violation)?;
        Ok(())
    }

    pub async fn rename<'c, X: sqlx::PgExecutor<'c>>(
        &self,
        name: &str,
        db: X,
    ) -> Result<Self, Error> {
        let res = sqlx::query_as(r#"UPDATE "Emoji" SET "name" = $2 WHERE "id" = $1 RETURNING *"#)
            .bind(self.id)
            .bind(name)
            .fetch_optional(db)
            .await
            .map_err(map_unique_violation)?
            .ok_or(Error::NotFound)?;
        Ok(res)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn emoji_names() {
        for ok in ["ok", "party_parrot", "A1", &"x".repeat(32)] {
            assert!(validate_emoji_name(ok).is_ok(), "{ok}");
        }
        for bad in [
            "",
            "a",
            "has space",
            "dash-ed",
            "colon:",
            "émoji",
            &"x".repeat(33),
        ] {
            assert!(validate_emoji_name(bad).is_err(), "{bad}");
        }
    }

    #[test]
    fn emoji_images() {
        assert!(validate_emoji_image("emoji/AbC_12-3.png").is_ok());
        assert!(validate_emoji_image("emoji/x.gif").is_ok());
        for bad in [
            "https://evil.example/x.png",
            "avatar/x.png",
            "emoji/../avatar/x.png",
            "emoji/x.svg",
            "emoji/x.png?y",
        ] {
            assert!(validate_emoji_image(bad).is_err(), "{bad}");
        }
    }
}
