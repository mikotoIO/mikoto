use std::collections::HashMap;

use chrono::NaiveDateTime;
use schemars::JsonSchema;
use uuid::Uuid;

use crate::{db_enum, entity, error::Error};

use super::group_by_key;

db_enum!(
    pub enum ChannelType {
        Text,
        Voice,
        Document,
        Application,
        Thread,
        Category,
    }
);

entity!(
    pub struct Channel {
        pub id: Uuid,
        pub space_id: Uuid,

        pub parent_id: Option<Uuid>,
        pub order: i32,

        pub name: String,
        #[serde(rename = "type")]
        #[sqlx(rename = "type")]
        pub category: ChannelType,
        pub last_updated: NaiveDateTime,
    }
);

entity!(
    pub struct Message {
        pub id: Uuid,
        pub channel_id: Uuid,
        pub author_id: Uuid,
        pub timestamp: NaiveDateTime,
        pub edited_timestamp: Option<NaiveDateTime>,
        pub content: String,
    }
);

entity!(
    pub struct Document {
        pub id: Uuid,
        pub channel_id: Uuid,
        pub content: String,
    }
);

#[derive(Serialize, Deserialize, JsonSchema)]
#[serde(rename_all = "camelCase")]
pub struct MessageExt {
    pub base: Message,
}

impl Channel {
    pub async fn list<'c, X: sqlx::PgExecutor<'c>>(
        space_id: Uuid,
        db: X,
    ) -> Result<Vec<Self>, crate::error::Error> {
        let channels = sqlx::query_as(r#"SELECT * FROM "Channels" WHERE "spaceId" = $1"#)
            .bind(space_id)
            .fetch_all(db)
            .await?;
        Ok(channels)
    }

    pub async fn dataload_space<'c, X: sqlx::PgExecutor<'c>>(
        space_ids: Vec<Uuid>,
        db: X,
    ) -> Result<HashMap<Uuid, Vec<Self>>, Error> {
        let channels: Vec<Self> = sqlx::query_as(
            r##"
            SELECT * FROM "Channels"
            WHERE "spaceId" = ANY($1)
            "##,
        )
        .bind(&space_ids)
        .fetch_all(db)
        .await?;
        Ok(group_by_key(channels, |x| x.space_id))
    }

    pub async fn create<'c, X: sqlx::PgExecutor<'c>>(&self, db: X) -> Result<(), Error> {
        sqlx::query(
            r##"
            INSERT INTO "Channels" ("id", "spaceId", "parentId", "order", "name", "type", "lastUpdated")
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            "##,
        )
        .bind(&self.id)
        .bind(&self.space_id)
        .bind(&self.parent_id)
        .bind(&self.order)
        .bind(&self.name)
        .bind(&self.category)
        .bind(&self.last_updated)
        .execute(db)
        .await?;
        Ok(())
    }
}
