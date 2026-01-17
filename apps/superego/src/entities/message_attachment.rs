use schemars::JsonSchema;
use uuid::Uuid;

use crate::{db_find_by_id, db_list_where, entity, error::Error};

entity!(
    pub struct MessageAttachment {
        pub id: Uuid,
        pub message_id: Uuid,
        pub url: String,
        pub filename: String,
        pub content_type: String,
        pub size: i32,
        pub order: i32,
    }
);

#[derive(Serialize, Deserialize, JsonSchema)]
#[serde(rename_all = "camelCase")]
pub struct MessageAttachmentInput {
    pub url: String,
    pub filename: String,
    pub content_type: String,
    pub size: i32,
}

impl MessageAttachment {
    pub fn new(message_id: Uuid, input: MessageAttachmentInput, order: i32) -> Self {
        Self {
            id: Uuid::new_v4(),
            message_id,
            url: input.url,
            filename: input.filename,
            content_type: input.content_type,
            size: input.size,
            order,
        }
    }

    db_find_by_id!("MessageAttachment");
    db_list_where!(
        "MessageAttachment",
        list_by_message,
        "messageId",
        message_id,
        Uuid
    );

    pub async fn create<'c, X: sqlx::PgExecutor<'c>>(&self, db: X) -> Result<(), Error> {
        sqlx::query(
            r#"
            INSERT INTO "MessageAttachment" ("id", "messageId", "url", "filename", "contentType", "size", "order")
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            "#,
        )
        .bind(self.id)
        .bind(self.message_id)
        .bind(&self.url)
        .bind(&self.filename)
        .bind(&self.content_type)
        .bind(self.size)
        .bind(self.order)
        .execute(db)
        .await?;
        Ok(())
    }
}
