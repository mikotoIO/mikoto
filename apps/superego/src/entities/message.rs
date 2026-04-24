use chrono::TimeDelta;
use schemars::JsonSchema;
use uuid::Uuid;

use crate::{
    db_entity_delete, db_find_by_id, entity, error::Error, functions::time::Timestamp, model,
};

use super::{Channel, MessageAttachment, User};

entity!(
    pub struct Message {
        pub id: Uuid,
        pub channel_id: Uuid,
        pub author_id: Option<Uuid>,
        pub timestamp: Timestamp,
        pub edited_timestamp: Option<Timestamp>,
        pub content: String,
    }
);

#[derive(Serialize)]
pub struct MessagePatch {
    pub content: Option<String>,
    pub edited_timestamp: Option<Timestamp>,
}

#[derive(Clone, Serialize, Deserialize, JsonSchema)]
#[serde(rename_all = "camelCase")]
pub struct MessageExt {
    #[serde(flatten)]
    pub base: Message,
    pub author: Option<User>,
    pub attachments: Vec<MessageAttachment>,
}

model!(
    pub struct MessageKey {
        pub channel_id: Uuid,
        pub message_id: Uuid,
    }
);

impl Message {
    pub fn new(channel: &Channel, author_id: Uuid, content: String) -> Self {
        Self {
            id: Uuid::new_v4(),
            channel_id: channel.id,
            author_id: Some(author_id),
            timestamp: Timestamp::now(),
            edited_timestamp: None,
            content,
        }
    }

    db_find_by_id!("Message");

    pub async fn paginate<'c, X: sqlx::PgExecutor<'c> + Copy>(
        channel_id: Uuid,
        cursor: Option<Uuid>,
        limit: i32,
        db: X,
    ) -> Result<Vec<Self>, Error> {
        let pagination_time = if let Some(cursor_id) = cursor {
            Self::find_by_id(cursor_id, db).await?.timestamp
        } else {
            Timestamp::now() + TimeDelta::hours(1)
        };

        let res = sqlx::query_as(
            r#"
            SELECT * FROM "Message"
            WHERE "channelId" = $1 AND "timestamp" < $2
            ORDER BY "timestamp" DESC
            LIMIT $3
            "#,
        )
        .bind(channel_id)
        .bind(pagination_time)
        .bind(limit)
        .fetch_all(db)
        .await?;
        // reverse the order
        Ok(res.into_iter().rev().collect())
    }

    pub async fn create<'c, X: sqlx::PgExecutor<'c>>(&self, db: X) -> Result<(), Error> {
        sqlx::query(
            r#"
            INSERT INTO "Message" ("id", "channelId", "authorId", "timestamp", "editedTimestamp", "content")
            VALUES ($1, $2, $3, $4, $5, $6)
            "#,
        )
        .bind(self.id)
        .bind(self.channel_id)
        .bind(self.author_id)
        .bind(self.timestamp)
        .bind(self.edited_timestamp)
        .bind(&self.content)
        .execute(db)
        .await?;
        Ok(())
    }

    pub async fn update<'c, X: sqlx::PgExecutor<'c>>(
        &self,
        patch: MessagePatch,
        db: X,
    ) -> Result<Self, Error> {
        let res = sqlx::query_as(
            r#"
            UPDATE "Message"
            SET
            "content" = COALESCE($2, "content"),
            "editedTimestamp" = COALESCE($3, "editedTimestamp")
            WHERE "id" = $1
            RETURNING *
            "#,
        )
        .bind(self.id)
        .bind(&patch.content)
        .bind(patch.edited_timestamp)
        .fetch_one(db)
        .await?;
        Ok(res)
    }

    db_entity_delete!("Message");
}

impl MessagePatch {
    pub fn edit(content: String) -> Self {
        Self {
            content: Some(content),
            edited_timestamp: Some(Timestamp::now()),
        }
    }
}

impl MessageExt {
    pub async fn dataload_one<'c, X: sqlx::PgExecutor<'c> + Copy>(
        message: Message,
        db: X,
    ) -> Result<Self, Error> {
        let author = if let Some(author_id) = message.author_id {
            Some(User::find_by_id(author_id, db).await?)
        } else {
            None
        };
        let attachments = MessageAttachment::list_by_message(message.id, db).await?;
        Ok(MessageExt {
            base: message,
            author,
            attachments,
        })
    }

    pub async fn dataload<'c, X: sqlx::PgExecutor<'c> + Copy>(
        messages: Vec<Message>,
        db: X,
    ) -> Result<Vec<Self>, Error> {
        let author_ids: Vec<Uuid> = messages.iter().filter_map(|m| m.author_id).collect();
        let authors = User::dataload(author_ids, db).await?;

        // Load all attachments for all messages
        let message_ids: Vec<Uuid> = messages.iter().map(|m| m.id).collect();
        let all_attachments = if !message_ids.is_empty() {
            sqlx::query_as::<_, MessageAttachment>(
                r#"
                SELECT * FROM "MessageAttachment"
                WHERE "messageId" = ANY($1)
                ORDER BY "messageId", "order"
                "#,
            )
            .bind(&message_ids)
            .fetch_all(db)
            .await?
        } else {
            Vec::new()
        };

        let attachments_by_message =
            crate::entities::group_by_key(all_attachments, |a| a.message_id);

        let res = messages
            .into_iter()
            .map(|message| {
                let author = if let Some(author_id) = message.author_id {
                    authors.get(&author_id).cloned()
                } else {
                    None
                };
                let attachments = attachments_by_message
                    .get(&message.id)
                    .cloned()
                    .unwrap_or_default();
                MessageExt {
                    base: message,
                    author,
                    attachments,
                }
            })
            .collect();
        Ok(res)
    }
}
