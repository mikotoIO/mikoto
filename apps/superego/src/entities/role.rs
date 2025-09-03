use std::collections::HashMap;

use schemars::JsonSchema;
use uuid::Uuid;

use crate::{db_entity_delete, db_find_by_id, db_list_where, entity, error::Error};

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

#[derive(sqlx::FromRow, Clone, Debug, Serialize, Deserialize, schemars::JsonSchema)]
pub struct RoleToSpaceUser {
    #[sqlx(rename = "A")]
    pub role_id: Uuid,
    #[sqlx(rename = "B")]
    pub member_id: Uuid,
}

#[derive(Deserialize, JsonSchema)]
#[serde(rename_all = "camelCase")]
pub struct RolePatch {
    pub name: String,
    pub color: Option<String>,
    pub permissions: String,
    pub position: i32,
}

impl Role {
    db_list_where!("Role", list, "spaceId", space_id, Uuid);
    db_find_by_id!("Role");

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

    pub async fn create<'c, X: sqlx::PgExecutor<'c>>(&self, db: X) -> Result<(), Error> {
        sqlx::query(
            r##"
            INSERT INTO "Role" ("id", "spaceId", "name", "color", "permissions", "position")
            VALUES ($1, $2, $3, $4, $5, $6)
            "##,
        )
        .bind(self.id)
        .bind(self.space_id)
        .bind(&self.name)
        .bind(&self.color)
        .bind(&self.permissions)
        .bind(self.position)
        .execute(db)
        .await?;
        Ok(())
    }

    pub async fn update<'c, X: sqlx::PgExecutor<'c>>(
        &self,
        patch: &RolePatch,
        db: X,
    ) -> Result<Self, Error> {
        // use coalesce to update only non-null fields
        let res = sqlx::query_as(
            r##"
            UPDATE "Role" SET
            "name" = coalesce($2, "name"),
            "color" = coalesce($3, "color"),
            "permissions" = coalesce($4, "permissions"),
            "position" = coalesce($5, "position")
            WHERE "id" = $1
            RETURNING *
            "##,
        )
        .bind(self.id)
        .bind(&patch.name)
        .bind(&patch.color)
        .bind(&patch.permissions)
        .bind(patch.position)
        .fetch_optional(db)
        .await?
        .ok_or(Error::NotFound)?;
        Ok(res)
    }

    db_entity_delete!("Role");
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
        .bind(member_id)
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

    pub async fn create<'c, X: sqlx::PgExecutor<'c>>(
        role_id: Uuid,
        member_id: Uuid,
        db: X,
    ) -> Result<(), Error> {
        sqlx::query(
            r##"
            INSERT INTO "_RoleToSpaceUser" ("A", "B")
            VALUES ($1, $2)
            "##,
        )
        .bind(role_id)
        .bind(member_id)
        .execute(db)
        .await?;
        Ok(())
    }

    pub async fn delete<'c, X: sqlx::PgExecutor<'c>>(
        role_id: Uuid,
        member_id: Uuid,
        db: X,
    ) -> Result<(), Error> {
        sqlx::query(
            r##"
            DELETE FROM "_RoleToSpaceUser"
            WHERE "A" = $1 AND "B" = $2
            "##,
        )
        .bind(role_id)
        .bind(member_id)
        .execute(db)
        .await?;
        Ok(())
    }
}
