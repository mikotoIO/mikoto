use schemars::JsonSchema;
use sqlx::FromRow;
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
        .bind(channel_id)
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
        .bind(self.id)
        .bind(self.channel_id)
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
        .bind(self.id)
        .bind(&patch.content)
        .fetch_one(db)
        .await?;
        Ok(res)
    }

    pub async fn search_in_space<'c, X: sqlx::PgExecutor<'c>>(
        space_id: Uuid,
        query: &str,
        channel_id: Option<Uuid>,
        limit: i32,
        offset: i32,
        db: X,
    ) -> Result<Vec<DocumentSearchHit>, Error> {
        let res = sqlx::query_as(
            r##"
            SELECT d.*,
                   ts_headline(
                       'simple',
                       d."content",
                       websearch_to_tsquery('simple', $1),
                       'StartSel=<mark>,StopSel=</mark>,MaxFragments=2,MaxWords=24,MinWords=6'
                   ) AS "snippet"
            FROM "Document" d
            JOIN "Channel" c ON c."id" = d."channelId"
            WHERE c."spaceId" = $2
              AND d."searchTsv" @@ websearch_to_tsquery('simple', $1)
              AND ($3::uuid IS NULL OR d."channelId" = $3)
            ORDER BY ts_rank_cd(d."searchTsv", websearch_to_tsquery('simple', $1)) DESC
            LIMIT $4 OFFSET $5
            "##,
        )
        .bind(query)
        .bind(space_id)
        .bind(channel_id)
        .bind(limit as i64)
        .bind(offset as i64)
        .fetch_all(db)
        .await?;
        Ok(res)
    }
}

#[derive(FromRow)]
pub struct DocumentSearchHit {
    #[sqlx(flatten)]
    pub document: Document,
    pub snippet: String,
}

#[derive(Clone, Serialize, Deserialize, JsonSchema)]
#[serde(rename_all = "camelCase")]
pub struct DocumentSearchResult {
    #[serde(flatten)]
    pub document: Document,
    pub snippet: String,
}

impl From<DocumentSearchHit> for DocumentSearchResult {
    fn from(hit: DocumentSearchHit) -> Self {
        Self {
            document: hit.document,
            snippet: hit.snippet,
        }
    }
}
