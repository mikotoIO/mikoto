use uuid::Uuid;

use crate::{entity, error::Error, model};

entity!(
    pub struct Document {
        pub id: Uuid,
        pub channel_id: Uuid,
        pub content: String,
    }
);

model!(
    pub struct DocumentPatch {
        pub content: Option<String>,
    }
);

impl Document {
    pub async fn get_by_channel_id<'c, X: sqlx::PgExecutor<'c>>(
        channel_id: Uuid,
        db: X,
    ) -> Result<Self, Error> {
        sqlx::query_as(
            r##"
            SELECT * FROM "Document" WHERE "channelId" = $1
            "##,
        )
        .bind(&channel_id)
        .fetch_optional(db)
        .await?
        .ok_or(Error::NotFound)
    }

    pub fn new(channel_id: Uuid, content: String) -> Self {
        Self {
            id: Uuid::new_v4(),
            channel_id,
            content,
        }
    }

    pub async fn create<'c, X: sqlx::PgExecutor<'c>>(&self, db: X) -> Result<Self, Error> {
        sqlx::query_as(
            r##"
            INSERT INTO "Document" ("id", "channelId", "content")
            VALUES ($1, $2, $3)
            RETURNING *
            "##,
        )
        .bind(&self.id)
        .bind(&self.channel_id)
        .bind(&self.content)
        .fetch_optional(db)
        .await?
        .ok_or(Error::NotFound)
    }

    pub async fn update<'c, X: sqlx::PgExecutor<'c>>(
        &self,
        patch: DocumentPatch,
        db: X,
    ) -> Result<Self, crate::error::Error> {
        let res = sqlx::query_as(
            r##"
            UPDATE "Document" SET
            "content" = COALESCE($2, "content")
            WHERE "id" = $1
            RETURNING *
            "##,
        )
        .bind(&self.id)
        .bind(&patch.content)
        .fetch_one(db)
        .await?;
        Ok(res)
    }
}
