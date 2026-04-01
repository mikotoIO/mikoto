use schemars::JsonSchema;
use uuid::Uuid;

use crate::{entity, error::Error, functions::time::Timestamp};

entity!(
    pub struct KeyPackage {
        pub id: Uuid,
        pub user_id: Uuid,
        pub device_id: Uuid,
        pub data: Vec<u8>,
        pub ciphersuite: String,
        pub created_at: Timestamp,
        pub consumed: bool,
    }
);

#[derive(Serialize, Deserialize, JsonSchema)]
#[serde(rename_all = "camelCase")]
pub struct KeyPackageUploadItem {
    pub device_id: Uuid,
    #[serde(with = "base64_bytes")]
    #[schemars(with = "String")]
    pub data: Vec<u8>,
    pub ciphersuite: String,
}

#[derive(Serialize, Deserialize, JsonSchema)]
#[serde(rename_all = "camelCase")]
pub struct KeyPackageExt {
    pub id: Uuid,
    pub user_id: Uuid,
    pub device_id: Uuid,
    #[serde(with = "base64_bytes")]
    #[schemars(with = "String")]
    pub data: Vec<u8>,
    pub ciphersuite: String,
}

impl From<KeyPackage> for KeyPackageExt {
    fn from(kp: KeyPackage) -> Self {
        Self {
            id: kp.id,
            user_id: kp.user_id,
            device_id: kp.device_id,
            data: kp.data,
            ciphersuite: kp.ciphersuite,
        }
    }
}

impl KeyPackage {
    pub async fn create_batch<'c, X: sqlx::PgExecutor<'c>>(
        user_id: Uuid,
        items: Vec<KeyPackageUploadItem>,
        db: X,
    ) -> Result<(), Error> {
        // Build a batch insert
        let mut ids = Vec::with_capacity(items.len());
        let mut device_ids = Vec::with_capacity(items.len());
        let mut datas = Vec::with_capacity(items.len());
        let mut ciphersuites = Vec::with_capacity(items.len());

        for item in &items {
            ids.push(Uuid::new_v4());
            device_ids.push(item.device_id);
            datas.push(item.data.as_slice());
            ciphersuites.push(item.ciphersuite.as_str());
        }

        sqlx::query(
            r#"
            INSERT INTO "KeyPackage" (id, "userId", "deviceId", data, ciphersuite)
            SELECT * FROM UNNEST($1::uuid[], $2::uuid[], $3::uuid[], $4::bytea[], $5::text[])
            "#,
        )
        .bind(&ids)
        .bind(&vec![user_id; items.len()])
        .bind(&device_ids)
        .bind(&datas)
        .bind(&ciphersuites)
        .execute(db)
        .await?;
        Ok(())
    }

    /// Atomically fetch and consume one unconsumed KeyPackage for a user.
    pub async fn fetch_one_unconsumed<'c, X: sqlx::PgExecutor<'c>>(
        user_id: Uuid,
        db: X,
    ) -> Result<Option<Self>, Error> {
        let res = sqlx::query_as(
            r#"
            UPDATE "KeyPackage"
            SET consumed = TRUE
            WHERE id = (
                SELECT id FROM "KeyPackage"
                WHERE "userId" = $1 AND consumed = FALSE
                LIMIT 1
                FOR UPDATE SKIP LOCKED
            )
            RETURNING *
            "#,
        )
        .bind(user_id)
        .fetch_optional(db)
        .await?;
        Ok(res)
    }

    /// Fetch one unconsumed KeyPackage per device for a user (for multi-device).
    pub async fn fetch_all_devices<'c, X: sqlx::PgExecutor<'c>>(
        user_id: Uuid,
        db: X,
    ) -> Result<Vec<Self>, Error> {
        let res = sqlx::query_as(
            r#"
            UPDATE "KeyPackage"
            SET consumed = TRUE
            WHERE id IN (
                SELECT DISTINCT ON ("deviceId") id
                FROM "KeyPackage"
                WHERE "userId" = $1 AND consumed = FALSE
                ORDER BY "deviceId", "createdAt" ASC
                FOR UPDATE SKIP LOCKED
            )
            RETURNING *
            "#,
        )
        .bind(user_id)
        .fetch_all(db)
        .await?;
        Ok(res)
    }

    pub async fn delete_by_device<'c, X: sqlx::PgExecutor<'c>>(
        user_id: Uuid,
        device_id: Uuid,
        db: X,
    ) -> Result<u64, Error> {
        let result = sqlx::query(
            r#"
            DELETE FROM "KeyPackage"
            WHERE "userId" = $1 AND "deviceId" = $2
            "#,
        )
        .bind(user_id)
        .bind(device_id)
        .execute(db)
        .await?;
        Ok(result.rows_affected())
    }

    pub async fn count_unconsumed<'c, X: sqlx::PgExecutor<'c>>(
        user_id: Uuid,
        db: X,
    ) -> Result<i64, Error> {
        let (count,): (i64,) = sqlx::query_as(
            r#"
            SELECT COUNT(*) FROM "KeyPackage"
            WHERE "userId" = $1 AND consumed = FALSE
            "#,
        )
        .bind(user_id)
        .fetch_one(db)
        .await?;
        Ok(count)
    }
}

/// Serde helper for base64-encoded byte arrays in JSON
pub(crate) mod base64_bytes {
    use base64::{engine::general_purpose::STANDARD, Engine};
    use serde::{self, Deserialize, Deserializer, Serializer};

    pub fn serialize<S>(bytes: &Vec<u8>, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        serializer.serialize_str(&STANDARD.encode(bytes))
    }

    pub fn deserialize<'de, D>(deserializer: D) -> Result<Vec<u8>, D::Error>
    where
        D: Deserializer<'de>,
    {
        let s = String::deserialize(deserializer)?;
        STANDARD.decode(&s).map_err(serde::de::Error::custom)
    }
}

/// Serde helper for optional base64-encoded byte arrays
pub(crate) mod optional_base64_bytes {
    use base64::{engine::general_purpose::STANDARD, Engine};
    use serde::{self, Deserialize, Deserializer, Serializer};

    pub fn serialize<S>(bytes: &Option<Vec<u8>>, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        match bytes {
            Some(b) => serializer.serialize_str(&STANDARD.encode(b)),
            None => serializer.serialize_none(),
        }
    }

    pub fn deserialize<'de, D>(deserializer: D) -> Result<Option<Vec<u8>>, D::Error>
    where
        D: Deserializer<'de>,
    {
        let opt: Option<String> = Option::deserialize(deserializer)?;
        match opt {
            Some(s) => STANDARD
                .decode(&s)
                .map(Some)
                .map_err(serde::de::Error::custom),
            None => Ok(None),
        }
    }
}
