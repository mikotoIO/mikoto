use schemars::JsonSchema;
use uuid::Uuid;

use crate::{entity, error::Error, functions::time::Timestamp};

entity!(
    pub struct MlsMessage {
        pub id: Uuid,
        pub recipient_user_id: Uuid,
        pub mls_group_id: Uuid,
        pub message_type: String,
        pub data: Vec<u8>,
        pub created_at: Timestamp,
        pub delivered: bool,
    }
);

#[derive(Serialize, Deserialize, JsonSchema)]
#[serde(rename_all = "camelCase")]
pub struct MlsMessageExt {
    pub id: Uuid,
    pub mls_group_id: Uuid,
    pub message_type: String,
    #[serde(with = "super::key_package::base64_bytes")]
    #[schemars(with = "String")]
    pub data: Vec<u8>,
}

impl From<MlsMessage> for MlsMessageExt {
    fn from(m: MlsMessage) -> Self {
        Self {
            id: m.id,
            mls_group_id: m.mls_group_id,
            message_type: m.message_type,
            data: m.data,
        }
    }
}

#[derive(Deserialize, JsonSchema)]
#[serde(rename_all = "camelCase")]
pub struct MlsMessageSendItem {
    pub recipient_user_id: Uuid,
    pub mls_group_id: Uuid,
    pub message_type: String,
    #[serde(with = "super::key_package::base64_bytes")]
    #[schemars(with = "String")]
    pub data: Vec<u8>,
}

impl MlsMessage {
    pub async fn create_batch<'c, X: sqlx::PgExecutor<'c>>(
        items: &[MlsMessageSendItem],
        db: X,
    ) -> Result<Vec<Self>, Error> {
        let mut ids = Vec::with_capacity(items.len());
        let mut recipient_ids = Vec::with_capacity(items.len());
        let mut group_ids = Vec::with_capacity(items.len());
        let mut types = Vec::with_capacity(items.len());
        let mut datas: Vec<&[u8]> = Vec::with_capacity(items.len());

        for item in items {
            ids.push(Uuid::new_v4());
            recipient_ids.push(item.recipient_user_id);
            group_ids.push(item.mls_group_id);
            types.push(item.message_type.as_str());
            datas.push(item.data.as_slice());
        }

        let res = sqlx::query_as(
            r#"
            INSERT INTO "MlsMessage" (id, "recipientUserId", "mlsGroupId", "messageType", data)
            SELECT * FROM UNNEST($1::uuid[], $2::uuid[], $3::uuid[], $4::text[], $5::bytea[])
            RETURNING *
            "#,
        )
        .bind(&ids)
        .bind(&recipient_ids)
        .bind(&group_ids)
        .bind(&types)
        .bind(&datas)
        .fetch_all(db)
        .await?;
        Ok(res)
    }

    /// Fetch all pending messages for a user and mark them as delivered.
    pub async fn fetch_pending<'c, X: sqlx::PgExecutor<'c>>(
        user_id: Uuid,
        db: X,
    ) -> Result<Vec<Self>, Error> {
        let res = sqlx::query_as(
            r#"
            UPDATE "MlsMessage"
            SET delivered = TRUE
            WHERE "recipientUserId" = $1 AND delivered = FALSE
            RETURNING *
            "#,
        )
        .bind(user_id)
        .fetch_all(db)
        .await?;
        Ok(res)
    }
}
