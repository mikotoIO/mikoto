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
        pub id: Uuid,
        pub user_id: Uuid,
        pub relation_id: Uuid,

        pub state: RelationState,
        pub space_id: Option<Uuid>,
    }
);

/// Relationship with extended data including the related user
#[derive(Serialize, Deserialize, Clone, JsonSchema)]
#[serde(rename_all = "camelCase")]
pub struct RelationshipExt {
    #[serde(flatten)]
    pub base: Relationship,
    pub user: UserExt,
}

impl Relationship {
    db_find_by_id!("Relationship");

    pub fn new(user_id: Uuid, relation_id: Uuid, state: RelationState) -> Self {
        Self {
            id: Uuid::new_v4(),
            user_id,
            relation_id,
            state,
            space_id: None,
        }
    }

    pub async fn find_by_pair<'c, X: sqlx::PgExecutor<'c>>(
        user_id: Uuid,
        relation_id: Uuid,
        db: X,
    ) -> Result<Option<Self>, Error> {
        let res = sqlx::query_as(
            r##"
            SELECT * FROM "Relationship"
            WHERE "userId" = $1 AND "relationId" = $2
            "##,
        )
        .bind(user_id)
        .bind(relation_id)
        .fetch_optional(db)
        .await?;
        Ok(res)
    }

    pub async fn list_by_user<'c, X: sqlx::PgExecutor<'c>>(
        user_id: Uuid,
        db: X,
    ) -> Result<Vec<Self>, Error> {
        let res = sqlx::query_as(
            r##"
            SELECT * FROM "Relationship"
            WHERE "userId" = $1
            "##,
        )
        .bind(user_id)
        .fetch_all(db)
        .await?;
        Ok(res)
    }

    pub async fn create<'c, X: sqlx::PgExecutor<'c>>(&self, db: X) -> Result<(), Error> {
        sqlx::query(
            r##"
            INSERT INTO "Relationship" ("id", "userId", "relationId", "state", "spaceId")
            VALUES ($1, $2, $3, $4, $5)
            "##,
        )
        .bind(self.id)
        .bind(self.user_id)
        .bind(self.relation_id)
        .bind(self.state)
        .bind(self.space_id)
        .execute(db)
        .await?;
        Ok(())
    }

    pub async fn update_state<'c, X: sqlx::PgExecutor<'c>>(
        &self,
        new_state: RelationState,
        db: X,
    ) -> Result<Self, Error> {
        let res = sqlx::query_as(
            r##"
            UPDATE "Relationship"
            SET "state" = $2
            WHERE "id" = $1
            RETURNING *
            "##,
        )
        .bind(self.id)
        .bind(new_state)
        .fetch_optional(db)
        .await?
        .ok_or(Error::NotFound)?;
        Ok(res)
    }

    /// Set spaceId on both rows of a relationship pair
    pub async fn set_space_id<'c, X: sqlx::PgExecutor<'c>>(
        user_id: Uuid,
        relation_id: Uuid,
        space_id: Uuid,
        db: X,
    ) -> Result<(), Error> {
        sqlx::query(
            r##"
            UPDATE "Relationship"
            SET "spaceId" = $3
            WHERE ("userId" = $1 AND "relationId" = $2)
               OR ("userId" = $2 AND "relationId" = $1)
            "##,
        )
        .bind(user_id)
        .bind(relation_id)
        .bind(space_id)
        .execute(db)
        .await?;
        Ok(())
    }

    /// Delete both rows of a relationship pair
    pub async fn delete_pair<'c, X: sqlx::PgExecutor<'c>>(
        user_id: Uuid,
        relation_id: Uuid,
        db: X,
    ) -> Result<(), Error> {
        sqlx::query(
            r##"
            DELETE FROM "Relationship"
            WHERE ("userId" = $1 AND "relationId" = $2)
               OR ("userId" = $2 AND "relationId" = $1)
            "##,
        )
        .bind(user_id)
        .bind(relation_id)
        .execute(db)
        .await?;
        Ok(())
    }
}

impl RelationshipExt {
    pub async fn from_relationship<'c, X: sqlx::PgExecutor<'c> + Copy>(
        rel: Relationship,
        db: X,
    ) -> Result<Self, Error> {
        let user = User::find_by_id(rel.relation_id, db).await?;
        let user_ext = UserExt::from_user(user, db).await?;
        Ok(Self {
            base: rel,
            user: user_ext,
        })
    }

    pub async fn dataload<'c, X: sqlx::PgExecutor<'c> + Copy>(
        rels: Vec<Relationship>,
        db: X,
    ) -> Result<Vec<Self>, Error> {
        let relation_ids: Vec<Uuid> = rels.iter().map(|r| r.relation_id).collect();
        let users = User::dataload(relation_ids, db).await?;
        let plain_users: Vec<User> = rels
            .iter()
            .map(|r| users.get(&r.relation_id).cloned().unwrap_or_else(User::ghost))
            .collect();
        let user_exts = UserExt::dataload(plain_users, db).await?;
        let user_ext_map: HashMap<Uuid, UserExt> =
            user_exts.into_iter().map(|u| (u.base.id, u)).collect();

        Ok(rels
            .into_iter()
            .map(|rel| {
                let user = user_ext_map
                    .get(&rel.relation_id)
                    .cloned()
                    .unwrap_or_else(|| UserExt {
                        base: User::ghost(),
                        handle: None,
                    });
                Self { base: rel, user }
            })
            .collect())
    }
}

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
                Self { handle, base: user }
            })
            .collect())
    }
}
