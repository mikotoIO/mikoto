use std::collections::HashMap;

use schemars::JsonSchema;
use uuid::Uuid;

use crate::{db_enum, db_find_by_id, entity, error::Error};

use super::{hashmap_by_key, Handle};

db_enum!(
    #[sqlx(type_name = "\"UserCategory\"")]
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
    #[sqlx(type_name = "\"RelationState\"")]
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

/// User with extended data including handle
#[derive(Debug, Serialize, Deserialize, Clone, JsonSchema)]
#[serde(rename_all = "camelCase")]
pub struct UserExt {
    #[serde(flatten)]
    pub base: User,
    /// The user's handle (if claimed)
    pub handle: Option<String>,
}

#[derive(Deserialize, JsonSchema)]
#[serde(rename_all = "camelCase")]
pub struct UserPatch {
    pub name: Option<String>,
    pub avatar: Option<String>,
    pub description: Option<String>,
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
            "avatar" = COALESCE($3, "avatar"),
            "description" = COALESCE($4, "description")
            WHERE "id" = $1
            RETURNING *
            "##,
        )
        .bind(self.id)
        .bind(patch.name)
        .bind(patch.avatar)
        .bind(patch.description)
        .fetch_optional(db)
        .await?
        .ok_or(Error::NotFound)?;
        Ok(res)
    }
}

impl UserExt {
    pub async fn from_user<'c, X: sqlx::PgExecutor<'c>>(user: User, db: X) -> Result<Self, Error> {
        let handle = Handle::for_user(user.id, db).await?;
        Ok(Self {
            handle: handle.map(|h| h.handle),
            base: user,
        })
    }

    pub async fn dataload<'c, X: sqlx::PgExecutor<'c>>(
        users: Vec<User>,
        db: X,
    ) -> Result<Vec<Self>, Error> {
        let user_ids: Vec<Uuid> = users.iter().map(|u| u.id).collect();
        let handles = Handle::for_users(&user_ids, db).await?;

        Ok(users
            .into_iter()
            .map(|user| {
                let handle = handles.get(&user.id).cloned();
                Self {
                    handle,
                    base: user,
                }
            })
            .collect())
    }
}
