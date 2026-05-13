use std::collections::HashMap;

use uuid::Uuid;

use crate::{
    db_entity_delete, db_find_by_id, db_list_where, entity, error::Error,
    functions::time::Timestamp,
};

use super::group_by_key;

entity!(
    pub struct Emoji {
        pub id: Uuid,
        pub space_id: Uuid,
        pub name: String,
        pub url: String,
        pub uploader_id: Option<Uuid>,
        pub created_at: Timestamp,
    }
);

impl Emoji {
    db_find_by_id!("Emoji");
    db_list_where!("Emoji", list_by_space, "spaceId", space_id, Uuid);

    pub fn new(space_id: Uuid, name: String, url: String, uploader_id: Uuid) -> Self {
        Self {
            id: Uuid::new_v4(),
            space_id,
            name,
            url,
            uploader_id: Some(uploader_id),
            created_at: Timestamp::now(),
        }
    }

    pub async fn create<'c, X: sqlx::PgExecutor<'c>>(&self, db: X) -> Result<(), Error> {
        sqlx::query(
            r#"
            INSERT INTO "Emoji" ("id", "spaceId", "name", "url", "uploaderId", "createdAt")
            VALUES ($1, $2, $3, $4, $5, $6)
            "#,
        )
        .bind(self.id)
        .bind(self.space_id)
        .bind(&self.name)
        .bind(&self.url)
        .bind(self.uploader_id)
        .bind(self.created_at)
        .execute(db)
        .await?;
        Ok(())
    }

    pub async fn rename<'c, X: sqlx::PgExecutor<'c>>(
        &self,
        new_name: &str,
        db: X,
    ) -> Result<Self, Error> {
        let res = sqlx::query_as(
            r#"
            UPDATE "Emoji" SET "name" = $2 WHERE "id" = $1 RETURNING *
            "#,
        )
        .bind(self.id)
        .bind(new_name)
        .fetch_one(db)
        .await?;
        Ok(res)
    }

    pub async fn dataload_by_ids<'c, X: sqlx::PgExecutor<'c>>(
        ids: &[Uuid],
        db: X,
    ) -> Result<HashMap<Uuid, Self>, Error> {
        if ids.is_empty() {
            return Ok(HashMap::new());
        }
        let xs: Vec<Self> = sqlx::query_as(
            r#"
            SELECT * FROM "Emoji" WHERE "id" = ANY($1)
            "#,
        )
        .bind(ids)
        .fetch_all(db)
        .await?;
        Ok(xs.into_iter().map(|e| (e.id, e)).collect())
    }

    pub async fn dataload_space<'c, X: sqlx::PgExecutor<'c>>(
        space_ids: Vec<Uuid>,
        db: X,
    ) -> Result<HashMap<Uuid, Vec<Self>>, Error> {
        let xs: Vec<Self> = sqlx::query_as(
            r#"
            SELECT * FROM "Emoji" WHERE "spaceId" = ANY($1) ORDER BY "createdAt" ASC
            "#,
        )
        .bind(&space_ids)
        .fetch_all(db)
        .await?;
        Ok(group_by_key(xs, |x| x.space_id))
    }

    db_entity_delete!("Emoji");
}
