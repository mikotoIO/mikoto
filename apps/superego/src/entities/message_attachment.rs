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

    pub async fn create_many<'c, X: sqlx::PgExecutor<'c>>(
        attachments: &[Self],
        db: X,
    ) -> Result<(), Error> {
        if attachments.is_empty() {
            return Ok(());
        }

        let mut ids = Vec::with_capacity(attachments.len());
        let mut message_ids = Vec::with_capacity(attachments.len());
        let mut urls = Vec::with_capacity(attachments.len());
        let mut filenames = Vec::with_capacity(attachments.len());
        let mut content_types = Vec::with_capacity(attachments.len());
        let mut sizes = Vec::with_capacity(attachments.len());
        let mut orders = Vec::with_capacity(attachments.len());

        for a in attachments {
            ids.push(a.id);
            message_ids.push(a.message_id);
            urls.push(a.url.as_str());
            filenames.push(a.filename.as_str());
            content_types.push(a.content_type.as_str());
            sizes.push(a.size);
            orders.push(a.order);
        }

        sqlx::query(
            r#"
            INSERT INTO "MessageAttachment" ("id", "messageId", "url", "filename", "contentType", "size", "order")
            SELECT * FROM UNNEST($1::uuid[], $2::uuid[], $3::text[], $4::text[], $5::text[], $6::int[], $7::int[])
            "#,
        )
        .bind(&ids)
        .bind(&message_ids)
        .bind(&urls)
        .bind(&filenames)
        .bind(&content_types)
        .bind(&sizes)
        .bind(&orders)
        .execute(db)
        .await?;
        Ok(())
    }
}
