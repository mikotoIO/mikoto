use std::{collections::HashMap, sync::LazyLock};

use regex::Regex;
use uuid::Uuid;

use crate::{error::Error, functions::time::Timestamp, model};

use super::{Emoji, Message};

/// The most distinct emoji a single message may be reacted with.
pub const MAX_REACTIONS_PER_MESSAGE: i64 = 20;

/// What a reaction is made of, parsed from the `:emoji` path segment.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ReactionEmoji {
    /// A standard emoji, by its shortcode (`+1`, `heart`, `flag-jp`, ...).
    Standard(String),
    /// A space's custom emoji, by id.
    Custom(Uuid),
}

impl ReactionEmoji {
    pub fn parse(key: &str) -> Result<Self, Error> {
        // A constant pattern, known to compile.
        static SHORTCODE: LazyLock<Regex> =
            LazyLock::new(|| Regex::new(r"^[a-z0-9_+-]{1,64}$").unwrap());
        if let Ok(id) = Uuid::parse_str(key) {
            return Ok(Self::Custom(id));
        }
        if SHORTCODE.is_match(key) {
            return Ok(Self::Standard(key.to_string()));
        }
        Err(Error::new(
            "InvalidEmoji",
            axum::http::StatusCode::BAD_REQUEST,
            "Not a valid emoji",
        ))
    }

    /// The value stored in (and keyed by) `MessageReaction.emoji`.
    pub fn key(&self) -> String {
        match self {
            Self::Standard(code) => code.clone(),
            Self::Custom(id) => id.to_string(),
        }
    }

    pub fn emoji_id(&self) -> Option<Uuid> {
        match self {
            Self::Standard(_) => None,
            Self::Custom(id) => Some(*id),
        }
    }

    /// Checks that a custom emoji exists and belongs to `space_id`. Messages
    /// outside a space (DMs) can only take standard emoji.
    pub async fn verify<'c, X: sqlx::PgExecutor<'c>>(
        &self,
        space_id: Option<Uuid>,
        db: X,
    ) -> Result<(), Error> {
        let Self::Custom(id) = self else {
            return Ok(());
        };
        let emoji = Emoji::find_by_id(*id, db).await?;
        if Some(emoji.space_id) != space_id {
            return Err(Error::NotFound);
        }
        Ok(())
    }
}

model!(
    /// Everyone who reacted to a message with one emoji.
    pub struct Reaction {
        /// A standard emoji shortcode (e.g. `+1`), or the id of a custom emoji.
        /// This is the `:emoji` used to add or remove the reaction.
        pub emoji: String,
        /// Set when `emoji` is a custom emoji.
        pub emoji_id: Option<Uuid>,
        pub count: i64,
        /// Who reacted, earliest first.
        pub user_ids: Vec<Uuid>,
    }
);

model!(
    /// A user's reaction being added to or removed from a message.
    pub struct ReactionEvent {
        pub message_id: Uuid,
        pub channel_id: Uuid,
        pub user_id: Uuid,
        pub emoji: String,
        pub emoji_id: Option<Uuid>,
    }
);

#[derive(sqlx::FromRow)]
#[sqlx(rename_all = "camelCase")]
struct ReactionRow {
    message_id: Uuid,
    emoji: String,
    emoji_id: Option<Uuid>,
    count: i64,
    user_ids: Vec<Uuid>,
}

pub struct MessageReaction;

impl MessageReaction {
    /// Aggregated reactions of each message, in the order each emoji was first used.
    pub async fn dataload<'c, X: sqlx::PgExecutor<'c>>(
        message_ids: &[Uuid],
        db: X,
    ) -> Result<HashMap<Uuid, Vec<Reaction>>, Error> {
        if message_ids.is_empty() {
            return Ok(HashMap::new());
        }
        let rows: Vec<ReactionRow> = sqlx::query_as(
            r#"
            SELECT
                "messageId",
                "emoji",
                "emojiId",
                COUNT(*) AS "count",
                array_agg("userId" ORDER BY "createdAt", "userId") AS "userIds"
            FROM "MessageReaction"
            WHERE "messageId" = ANY($1)
            GROUP BY "messageId", "emoji", "emojiId"
            ORDER BY MIN("createdAt"), "emoji"
            "#,
        )
        .bind(message_ids)
        .fetch_all(db)
        .await?;

        let mut map: HashMap<Uuid, Vec<Reaction>> = HashMap::new();
        for row in rows {
            map.entry(row.message_id).or_default().push(Reaction {
                emoji: row.emoji,
                emoji_id: row.emoji_id,
                count: row.count,
                user_ids: row.user_ids,
            });
        }
        Ok(map)
    }

    /// Adds `user_id`'s reaction. Returns false if it was already there.
    pub async fn add(
        message: &Message,
        user_id: Uuid,
        emoji: &ReactionEmoji,
        db: &sqlx::PgPool,
    ) -> Result<bool, Error> {
        let key = emoji.key();
        let mut tx = db.begin().await?;
        // Serialize reactions to this message so the distinct-emoji cap holds.
        sqlx::query(r#"SELECT 1 FROM "Message" WHERE "id" = $1 FOR UPDATE"#)
            .bind(message.id)
            .execute(&mut *tx)
            .await?;

        let (distinct, already_used): (i64, bool) = sqlx::query_as(
            r#"
            SELECT COUNT(DISTINCT "emoji"), COALESCE(bool_or("emoji" = $2), false)
            FROM "MessageReaction" WHERE "messageId" = $1
            "#,
        )
        .bind(message.id)
        .bind(&key)
        .fetch_one(&mut *tx)
        .await?;
        if !already_used && distinct >= MAX_REACTIONS_PER_MESSAGE {
            return Err(Error::new(
                "TooManyReactions",
                axum::http::StatusCode::BAD_REQUEST,
                "This message can't take any more different reactions",
            ));
        }

        let inserted = sqlx::query(
            r#"
            INSERT INTO "MessageReaction" ("messageId", "userId", "emoji", "emojiId", "createdAt")
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT DO NOTHING
            "#,
        )
        .bind(message.id)
        .bind(user_id)
        .bind(&key)
        .bind(emoji.emoji_id())
        .bind(Timestamp::now())
        .execute(&mut *tx)
        .await?
        .rows_affected()
            > 0;
        tx.commit().await?;
        Ok(inserted)
    }

    /// Removes `user_id`'s reaction. Returns false if there wasn't one.
    pub async fn remove<'c, X: sqlx::PgExecutor<'c>>(
        message_id: Uuid,
        user_id: Uuid,
        emoji: &ReactionEmoji,
        db: X,
    ) -> Result<bool, Error> {
        let removed = sqlx::query(
            r#"
            DELETE FROM "MessageReaction"
            WHERE "messageId" = $1 AND "userId" = $2 AND "emoji" = $3
            "#,
        )
        .bind(message_id)
        .bind(user_id)
        .bind(emoji.key())
        .execute(db)
        .await?
        .rows_affected()
            > 0;
        Ok(removed)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_reaction_emoji() {
        assert_eq!(
            ReactionEmoji::parse("+1").unwrap(),
            ReactionEmoji::Standard("+1".into())
        );
        assert_eq!(
            ReactionEmoji::parse("flag-jp").unwrap(),
            ReactionEmoji::Standard("flag-jp".into())
        );
        let id = Uuid::new_v4();
        assert_eq!(
            ReactionEmoji::parse(&id.to_string()).unwrap(),
            ReactionEmoji::Custom(id)
        );
        for bad in ["", "Heart", "has space", ":smile:", &"a".repeat(65)] {
            assert!(ReactionEmoji::parse(bad).is_err(), "{bad}");
        }
    }
}
