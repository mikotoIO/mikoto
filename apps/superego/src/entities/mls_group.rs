use schemars::JsonSchema;
use uuid::Uuid;

use crate::{db_find_by_id, entity, error::Error, functions::time::Timestamp};

entity!(
    pub struct MlsGroup {
        pub id: Uuid,
        pub space_id: Uuid,
        pub group_id: Vec<u8>,
        pub epoch: i64,
        pub created_at: Timestamp,
    }
);

/// Serialized MlsGroup info returned to the client
#[derive(Serialize, Deserialize, JsonSchema)]
#[serde(rename_all = "camelCase")]
pub struct MlsGroupExt {
    pub id: Uuid,
    pub space_id: Uuid,
    #[serde(with = "super::key_package::base64_bytes")]
    #[schemars(with = "String")]
    pub group_id: Vec<u8>,
    pub epoch: i64,
}

impl From<MlsGroup> for MlsGroupExt {
    fn from(g: MlsGroup) -> Self {
        Self {
            id: g.id,
            space_id: g.space_id,
            group_id: g.group_id,
            epoch: g.epoch,
        }
    }
}

impl MlsGroup {
    db_find_by_id!("MlsGroup");

    pub async fn create<'c, X: sqlx::PgExecutor<'c>>(
        space_id: Uuid,
        group_id: Vec<u8>,
        db: X,
    ) -> Result<Self, Error> {
        let res = sqlx::query_as(
            r#"
            INSERT INTO "MlsGroup" (id, "spaceId", "groupId")
            VALUES (gen_random_uuid(), $1, $2)
            RETURNING *
            "#,
        )
        .bind(space_id)
        .bind(&group_id)
        .fetch_one(db)
        .await?;
        Ok(res)
    }

    pub async fn find_by_space_id<'c, X: sqlx::PgExecutor<'c>>(
        space_id: Uuid,
        db: X,
    ) -> Result<Option<Self>, Error> {
        let res = sqlx::query_as(
            r#"
            SELECT * FROM "MlsGroup" WHERE "spaceId" = $1
            "#,
        )
        .bind(space_id)
        .fetch_optional(db)
        .await?;
        Ok(res)
    }

    pub async fn update_epoch<'c, X: sqlx::PgExecutor<'c>>(
        &self,
        epoch: i64,
        db: X,
    ) -> Result<(), Error> {
        sqlx::query(
            r#"
            UPDATE "MlsGroup" SET epoch = $2 WHERE id = $1
            "#,
        )
        .bind(self.id)
        .bind(epoch)
        .execute(db)
        .await?;
        Ok(())
    }
}
