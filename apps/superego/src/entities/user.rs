use std::collections::HashMap;

use schemars::JsonSchema;
use uuid::Uuid;

use crate::{db_enum, db_find_by_id, entity, error::Error};

use super::hashmap_by_key;

db_enum!(
    #[sqlx(type_name = "UserCategory")]
    pub enum UserCategory {
        Bot,
        Unverified,
    }
);

entity!(
    pub struct User {
        pub id: Uuid,
        pub name: String,
        pub avatar: Option<String>,
        pub description: Option<String>,
        pub category: Option<UserCategory>,
    }
);

db_enum!(
    #[sqlx(type_name = "RelationState")]
    pub enum RelationState {
        None,
        Friend,
        Blocked,
        IncomingRequest,
        OutgoingRequest,
    }
);

entity!(
    pub struct Relationship {
        id: Uuid,
        user_id: Uuid,
        relation_id: Uuid,

        state: RelationState,
        space_id: Option<Uuid>,
    }
);

#[derive(Deserialize, JsonSchema)]
#[serde(rename_all = "camelCase")]
pub struct UserPatch {
    pub name: Option<String>,
    pub avatar: Option<String>,
}

impl User {
    pub fn ghost() -> Self {
        Self {
            id: Uuid::nil(),
            name: "Ghost".to_string(),
            avatar: None,
            description: None,
            category: None,
        }
    }

    db_find_by_id!("User");

    pub async fn dataload<'c, X: sqlx::PgExecutor<'c>>(
        member_ids: Vec<Uuid>,
        db: X,
    ) -> Result<HashMap<Uuid, Self>, Error> {
        let xs: Vec<Self> = sqlx::query_as(
            r##"
            SELECT * FROM "User" WHERE "id" = ANY($1)
            "##,
        )
        .bind(&member_ids)
        .fetch_all(db)
        .await?;
        Ok(hashmap_by_key(xs, |x| x.id))
    }

    pub async fn update<'c, X: sqlx::PgExecutor<'c>>(
        &self,
        patch: UserPatch,
        db: X,
    ) -> Result<Self, Error> {
        let res = sqlx::query_as(
            r##"
            UPDATE "User"
            SET
            "name" = COALESCE($2, "name"),
            "avatar" = COALESCE($3, "avatar")
            WHERE "id" = $1
            RETURNING *
            "##,
        )
        .bind(&self.id)
        .bind(patch.name)
        .bind(patch.avatar)
        .fetch_optional(db)
        .await?
        .ok_or(Error::NotFound)?;
        Ok(res)
    }
}
