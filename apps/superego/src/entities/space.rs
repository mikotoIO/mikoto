use std::collections::HashMap;

use chrono::NaiveDateTime;
use schemars::JsonSchema;
use uuid::Uuid;

use crate::{db_enum, entity, error::Error};

use super::{group_by_key, Channel};

db_enum!(
    pub enum SpaceType {
        None,
        Dm,
        Group,
    }
);

entity!(
    /// # SpaceDataModel
    pub struct Space {
        pub id: Uuid,
        pub name: String,
        pub icon: Option<String>,
        pub owner_id: Option<Uuid>,
        pub space_type: SpaceType,
    }
);

entity!(
    pub struct SpaceUser {
        pub id: Uuid,
        pub name: String,
        pub space_id: Uuid,
        pub user_id: Uuid,
    }
);

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
    pub struct Invite {
        pub id: String, // Not UUID, but a NanoID
        pub space_id: Uuid,
        pub created_at: NaiveDateTime,
        pub creator_id: Uuid,
    }
);

/// # Space
/// Represents a Mikoto Space.
#[derive(Serialize, Deserialize, JsonSchema)]
#[serde(rename_all = "camelCase")]
pub struct SpaceExt {
    #[serde(flatten)]
    pub base: Space,
    pub roles: Vec<Role>,
    pub channels: Vec<Channel>,
}

#[derive(Serialize, Deserialize, JsonSchema)]
#[serde(rename_all = "camelCase")]
pub struct Member {
    #[serde(flatten)]
    pub base: SpaceUser,
    pub role_ids: Vec<Uuid>,
}

impl Space {
    pub async fn get<'c, X: sqlx::PgExecutor<'c>>(id: &Uuid, db: X) -> Result<Space, Error> {
        let res = sqlx::query_as(
            r##"
            SELECT * FROM "Space" WHERE "id" = $1
            "##,
        )
        .bind(id)
        .fetch_optional(db)
        .await?
        .ok_or(Error::NotFound)?;
        Ok(res)
    }

    pub async fn list_from_user_id<'c, X: sqlx::PgExecutor<'c>>(
        user_id: Uuid,
        db: X,
    ) -> Result<Vec<Space>, Error> {
        let res = sqlx::query_as(
            r##"
            SELECT "Space".* FROM "Space"
            JOIN "SpaceUser" ON "SpaceUser"."spaceId" = "Space"."id"
            WHERE "SpaceUser"."userId" = $1
            "##,
        )
        .bind(user_id)
        .fetch_all(db)
        .await?;
        Ok(res)
    }
}

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

impl SpaceExt {
    pub async fn dataload_one<'c, X: sqlx::PgExecutor<'c> + Copy>(
        space: Space,
        db: X,
    ) -> Result<Self, Error> {
        let (channels, roles) =
            tokio::try_join!(Channel::list(space.id, db), Role::list(space.id, db),)?;

        Ok(SpaceExt {
            base: space,
            channels,
            roles,
        })
    }

    pub async fn dataload<'c, X: sqlx::PgExecutor<'c> + Copy>(
        spaces: Vec<Space>,
        db: X,
    ) -> Result<Vec<Self>, Error> {
        let (mut channels, mut roles) = tokio::try_join!(
            Channel::dataload_space(spaces.iter().map(|s| s.id).collect(), db),
            Role::dataload_space(spaces.iter().map(|s| s.id).collect(), db),
        )?;

        let res = spaces
            .into_iter()
            .map(|space| {
                let channels = channels.remove(&space.id).unwrap_or_default();
                let roles = roles.remove(&space.id).unwrap_or_default();

                SpaceExt {
                    base: space,
                    channels,
                    roles,
                }
            })
            .collect();
        Ok(res)
    }
}
