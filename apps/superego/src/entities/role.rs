use std::collections::HashMap;

use uuid::Uuid;

use crate::{db_list_where, entity, error::Error};

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
    db_list_where!("Role", list, "spaceId", space_id, Uuid);

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
