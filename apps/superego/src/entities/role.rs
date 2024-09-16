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

entity!(
    pub struct RoleToSpaceUser {
        #[sqlx(rename = "A")]
        pub role_id: Uuid,
        #[sqlx(rename = "B")]
        pub member_id: Uuid,
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

impl RoleToSpaceUser {
    pub async fn get_role_ids_by_member<'c, X: sqlx::PgExecutor<'c>>(
        member_id: Uuid,
        db: X,
    ) -> Result<Vec<Uuid>, Error> {
        let xs: Vec<Self> = sqlx::query_as(
            r##"
            SELECT * FROM "_RoleToSpaceUser" WHERE "B" = $1
            "##,
        )
        .bind(&member_id)
        .fetch_all(db)
        .await?;
        Ok(xs.into_iter().map(|x| x.role_id).collect())
    }

    pub async fn dataload_members<'c, X: sqlx::PgExecutor<'c>>(
        member_ids: Vec<Uuid>,
        db: X,
    ) -> Result<HashMap<Uuid, Vec<Uuid>>, Error> {
        let xs: Vec<Self> = sqlx::query_as(
            r##"
            SELECT * FROM "_RoleToSpaceUser" WHERE "B" = ANY($1)
            "##,
        )
        .bind(&member_ids)
        .fetch_all(db)
        .await?;
        Ok(group_by_key(xs, |x| x.member_id)
            .into_iter()
            .map(|(k, v)| (k, v.into_iter().map(|x| x.role_id).collect()))
            .collect())
    }
}
