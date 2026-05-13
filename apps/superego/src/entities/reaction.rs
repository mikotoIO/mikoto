use std::collections::HashMap;

use schemars::JsonSchema;
use uuid::Uuid;

use crate::{entity, error::Error, functions::time::Timestamp};

use super::group_by_key;

entity!(
    pub struct MessageReaction {
        pub message_id: Uuid,
        pub user_id: Uuid,
        pub emoji: String,
        pub created_at: Timestamp,
    }
);

/// A grouped reaction for a single emoji on a message.
#[derive(Clone, Serialize, Deserialize, JsonSchema)]
#[serde(rename_all = "camelCase")]
pub struct ReactionGroup {
    pub emoji: String,
    pub count: i64,
    pub user_ids: Vec<Uuid>,
}

impl MessageReaction {
    pub async fn add<'c, X: sqlx::PgExecutor<'c>>(
        message_id: Uuid,
        user_id: Uuid,
        emoji: &str,
        db: X,
    ) -> Result<Self, Error> {
        let res = sqlx::query_as(
            r#"
            INSERT INTO "MessageReaction" ("messageId", "userId", "emoji", "createdAt")
            VALUES ($1, $2, $3, $4)
            ON CONFLICT ("messageId", "userId", "emoji") DO UPDATE SET "emoji" = EXCLUDED."emoji"
            RETURNING *
            "#,
        )
        .bind(message_id)
        .bind(user_id)
        .bind(emoji)
        .bind(Timestamp::now())
        .fetch_one(db)
        .await?;
        Ok(res)
    }

    pub async fn remove<'c, X: sqlx::PgExecutor<'c>>(
        message_id: Uuid,
        user_id: Uuid,
        emoji: &str,
        db: X,
    ) -> Result<bool, Error> {
        let res = sqlx::query(
            r#"
            DELETE FROM "MessageReaction"
            WHERE "messageId" = $1 AND "userId" = $2 AND "emoji" = $3
            "#,
        )
        .bind(message_id)
        .bind(user_id)
        .bind(emoji)
        .execute(db)
        .await?;
        Ok(res.rows_affected() > 0)
    }

    pub async fn list_by_message<'c, X: sqlx::PgExecutor<'c>>(
        message_id: Uuid,
        db: X,
    ) -> Result<Vec<Self>, Error> {
        let xs = sqlx::query_as(
            r#"
            SELECT * FROM "MessageReaction" WHERE "messageId" = $1 ORDER BY "createdAt" ASC
            "#,
        )
        .bind(message_id)
        .fetch_all(db)
        .await?;
        Ok(xs)
    }

    pub async fn dataload_messages<'c, X: sqlx::PgExecutor<'c>>(
        message_ids: &[Uuid],
        db: X,
    ) -> Result<HashMap<Uuid, Vec<Self>>, Error> {
        if message_ids.is_empty() {
            return Ok(HashMap::new());
        }
        let xs: Vec<Self> = sqlx::query_as(
            r#"
            SELECT * FROM "MessageReaction"
            WHERE "messageId" = ANY($1)
            ORDER BY "createdAt" ASC
            "#,
        )
        .bind(message_ids)
        .fetch_all(db)
        .await?;
        Ok(group_by_key(xs, |x| x.message_id))
    }
}

impl ReactionGroup {
    /// Group raw reactions by emoji preserving insertion order.
    pub fn group(reactions: Vec<MessageReaction>) -> Vec<Self> {
        let mut order: Vec<String> = Vec::new();
        let mut by_emoji: HashMap<String, Vec<Uuid>> = HashMap::new();
        for r in reactions {
            let entry = by_emoji.entry(r.emoji.clone()).or_default();
            if entry.is_empty() {
                order.push(r.emoji.clone());
            }
            entry.push(r.user_id);
        }
        order
            .into_iter()
            .map(|emoji| {
                let user_ids = by_emoji.remove(&emoji).unwrap_or_default();
                let count = user_ids.len() as i64;
                ReactionGroup {
                    emoji,
                    count,
                    user_ids,
                }
            })
            .collect()
    }
}
