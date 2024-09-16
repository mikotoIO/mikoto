use std::collections::HashMap;

use uuid::Uuid;

use crate::{entity, error::Error};

use super::group_by_key;

entity!(
    pub struct Role {
        pub id: Uuid,
        pub space_id: Uuid,
        pub name: String,
        pub color: Option<String>,
        pub permissions: String,
        pub position: i32,
    }
);

impl Role {
    pub async fn list<'c, X: sqlx::PgExecutor<'c>>(
        space_id: Uuid,
        db: X,
    ) -> Result<Vec<Role>, Error> {
        let res = sqlx::query_as(
            r##"
            SELECT * FROM "Role" WHERE "spaceId" = $1
            "##,
        )
        .bind(space_id)
        .fetch_all(db)
        .await?;
        Ok(res)
    }

    pub async fn dataload_space<'c, X: sqlx::PgExecutor<'c>>(
        space_ids: Vec<Uuid>,
        db: X,
    ) -> Result<HashMap<Uuid, Vec<Self>>, Error> {
        let xs: Vec<Self> = sqlx::query_as(
            r##"
            SELECT * FROM "Role" WHERE "spaceId" = ANY($1)
            "##,
        )
        .bind(&space_ids)
        .fetch_all(db)
        .await?;
        Ok(group_by_key(xs, |x| x.space_id))
    }
}
