use std::collections::HashMap;

use chrono::NaiveDateTime;
use schemars::JsonSchema;
use uuid::Uuid;

use crate::{db_entity_delete, db_enum, db_find_by_id, db_list_where, entity, error::Error, model};

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

model!(
    pub struct ChannelKey {
        pub space_id: Uuid,
        pub channel_id: Uuid,
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
        pub last_updated: Option<NaiveDateTime>,
    }
);

entity!(
    pub struct ChannelUnread {
        pub channel_id: Uuid,
        pub user_id: Uuid,
        pub timestamp: NaiveDateTime,
    }
);

#[derive(Deserialize, JsonSchema)]
#[serde(rename_all = "camelCase")]
pub struct ChannelPatch {
    pub name: Option<String>,
}

impl Channel {
    db_find_by_id!("Channel");
    db_list_where!("Channel", list, "spaceId", space_id, Uuid);

    pub async fn dataload_space<'c, X: sqlx::PgExecutor<'c>>(
        space_ids: Vec<Uuid>,
        db: X,
    ) -> Result<HashMap<Uuid, Vec<Self>>, Error> {
        let channels: Vec<Self> = sqlx::query_as(
            r##"
            SELECT * FROM "Channel"
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
            INSERT INTO "Channel" ("id", "spaceId", "parentId", "order", "name", "type", "lastUpdated")
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

    pub async fn update<'c, X: sqlx::PgExecutor<'c>>(
        &self,
        patch: ChannelPatch,
        db: X,
    ) -> Result<Channel, Error> {
        let res = sqlx::query_as(
            r##"
            UPDATE "Channel" SET
            "name" = COALESCE($2, "name"),
            WHERE "id" = $1
            RETURNING *
            "##,
        )
        .bind(&self.id)
        .bind(&patch.name)
        .fetch_optional(db)
        .await?
        .ok_or(Error::NotFound)?;
        Ok(res)
    }

    db_entity_delete!("Channel");
}
