use std::collections::HashMap;

use schemars::JsonSchema;
use uuid::Uuid;

use crate::{db_entity_delete, entity, error::Error, model};

use super::{RoleToSpaceUser, User, UserExt};

entity!(
    pub struct SpaceUser {
        pub id: Uuid,
        pub space_id: Uuid,
        pub user_id: Uuid,

        pub name: Option<String>,
    }
);

#[derive(Serialize, Deserialize, JsonSchema)]
#[serde(rename_all = "camelCase")]
pub struct MemberExt {
    #[serde(flatten)]
    pub base: SpaceUser,
    pub user: UserExt,
    pub role_ids: Vec<Uuid>,
}

model!(
    pub struct MemberKey {
        pub space_id: Uuid,
        pub user_id: Uuid,
    }
);

impl MemberKey {
    pub fn new(space_id: Uuid, user_id: Uuid) -> Self {
        Self { space_id, user_id }
    }
}

impl SpaceUser {
    pub fn new(space_id: Uuid, user_id: Uuid) -> Self {
        Self {
            id: Uuid::new_v4(),
            space_id,
            user_id,
            name: None,
        }
    }

    pub async fn get_by_key<'c, X: sqlx::PgExecutor<'c>>(
        key: &MemberKey,
        db: X,
    ) -> Result<Self, Error> {
        let member = sqlx::query_as(
            r##"
            SELECT * FROM "SpaceUser"
            WHERE "spaceId" = $1 AND "userId" = $2
            "##,
        )
        .bind(key.space_id)
        .bind(key.user_id)
        .fetch_optional(db)
        .await?
        .ok_or(Error::NotFound)?;
        Ok(member)
    }

    pub async fn list_from_space<'c, X: sqlx::PgExecutor<'c>>(
        space_id: Uuid,
        db: X,
    ) -> Result<Vec<Self>, Error> {
        // TODO: pagination
        let members = sqlx::query_as(
            r##"
            SELECT * FROM "SpaceUser"
            WHERE "spaceId" = $1
            LIMIT 500
            "##,
        )
        .bind(space_id)
        .fetch_all(db)
        .await?;
        Ok(members)
    }

    pub async fn create<'c, X: sqlx::PgExecutor<'c>>(&self, db: X) -> Result<(), Error> {
        sqlx::query(
            r##"
            INSERT INTO "SpaceUser" ("id", "spaceId", "userId", "name")
            VALUES ($1, $2, $3, $4)
            "##,
        )
        .bind(self.id)
        .bind(self.space_id)
        .bind(self.user_id)
        .bind(&self.name)
        .execute(db)
        .await?;
        Ok(())
    }

    pub async fn delete_by_key<'c, X: sqlx::PgExecutor<'c>>(
        key: &MemberKey,
        db: X,
    ) -> Result<(), Error> {
        sqlx::query(
            r##"
            DELETE FROM "SpaceUser"
            WHERE "spaceId" = $1 AND "userId" = $2
            "##,
        )
        .bind(key.space_id)
        .bind(key.user_id)
        .execute(db)
        .await?;
        Ok(())
    }

    db_entity_delete!("SpaceUser");
}

impl MemberExt {
    pub async fn dataload_one<'c, X: sqlx::PgExecutor<'c> + Copy>(
        base: SpaceUser,
        db: X,
    ) -> Result<Self, Error> {
        let (role_ids, user) = tokio::try_join!(
            RoleToSpaceUser::get_role_ids_by_member(base.id, db),
            User::find_by_id(base.user_id, db)
        )?;
        let user = UserExt::from_user(user, db).await?;

        Ok(Self {
            base,
            user,
            role_ids,
        })
    }

    pub async fn dataload<'c, X: sqlx::PgExecutor<'c> + Copy>(
        members: Vec<SpaceUser>,
        db: X,
    ) -> Result<Vec<Self>, Error> {
        let (users, role_ids) = tokio::try_join!(
            User::dataload(members.iter().map(|member| member.user_id).collect(), db),
            RoleToSpaceUser::dataload_members(members.iter().map(|member| member.id).collect(), db),
        )?;

        let plain_users: Vec<User> = members
            .iter()
            .map(|member| users.get(&member.user_id).unwrap_or(&User::ghost()).clone())
            .collect();
        let user_exts = UserExt::dataload(plain_users, db).await?;
        let user_ext_map: HashMap<Uuid, UserExt> =
            user_exts.into_iter().map(|u| (u.base.id, u)).collect();

        Ok(members
            .into_iter()
            .map(|member| {
                let user_id = member.user_id;
                let member_id = member.id;
                Self {
                    base: member,
                    user: user_ext_map
                        .get(&user_id)
                        .cloned()
                        .unwrap_or_else(|| UserExt {
                            base: User::ghost(),
                            handle: "ghost".to_string(),
                        }),
                    role_ids: role_ids
                        .get(&member_id)
                        .map_or_else(std::vec::Vec::new, |ids| ids.clone()),
                }
            })
            .collect())
    }

    pub fn key(&self) -> MemberKey {
        MemberKey {
            space_id: self.base.space_id,
            user_id: self.base.user_id,
        }
    }
}
