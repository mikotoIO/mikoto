use schemars::JsonSchema;
use uuid::Uuid;

use crate::{db_entity_delete, db_enum, db_find_by_id, entities::Role, entity, error::Error};

use super::Channel;

db_enum!(
    #[sqlx(type_name = "SpaceType")]
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

        #[serde(rename = "type")]
        #[sqlx(rename = "type")]
        pub space_type: SpaceType,
    }
);

/// # Space
/// Represents a Mikoto Space.
#[derive(Serialize, Deserialize, Clone, JsonSchema)]
#[serde(rename_all = "camelCase")]
pub struct SpaceExt {
    #[serde(flatten)]
    pub base: Space,
    pub roles: Vec<Role>,
    pub channels: Vec<Channel>,
}

#[derive(Default)]
pub struct SpacePatch {
    pub name: Option<String>,
    pub icon: Option<String>,
    pub owner_id: Option<Uuid>,
}

impl Space {
    pub fn new(name: String, owner_id: Uuid) -> Self {
        Self {
            id: Uuid::new_v4(),
            name,
            icon: None,
            owner_id: Some(owner_id),
            space_type: SpaceType::None,
        }
    }

    db_find_by_id!("Space");

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

    pub async fn create<'c, X: sqlx::PgExecutor<'c>>(&self, db: X) -> Result<(), Error> {
        sqlx::query(
            r##"
            WITH "c" AS (
                INSERT INTO "Channel" ("id", "spaceId", "name", "order")
                VALUES (gen_random_uuid(), $1, 'general', 0)
                RETURNING "id"
            ),
            "r" AS (
                INSERT INTO "Role" ("id", "spaceId", "name", "position", "permissions")
                VALUES (gen_random_uuid(), $1, '@everyone', -1, '0')
                RETURNING "id"
            )
            INSERT INTO "Space" ("id", "name", "icon", "ownerId", "type")
            VALUES ($1, $2, $3, $4, $5)
            "##,
        )
        .bind(self.id)
        .bind(&self.name)
        .bind(&self.icon)
        .bind(self.owner_id)
        .bind(&self.space_type)
        .execute(db)
        .await?;
        Ok(())
    }

    pub async fn update<'c, X: sqlx::PgExecutor<'c>>(
        &self,
        patch: SpacePatch,
        db: X,
    ) -> Result<Space, Error> {
        let res = sqlx::query_as(
            r##"
            UPDATE "Space" SET
            "name" = COALESCE($2, "name"),
            "icon" = COALESCE($3, "icon"),
            "ownerId" = COALESCE($4, "ownerId")
            WHERE "id" = $1
            RETURNING *
            "##,
        )
        .bind(self.id)
        .bind(&patch.name)
        .bind(&patch.icon)
        .bind(patch.owner_id)
        .fetch_optional(db)
        .await?
        .ok_or(Error::NotFound)?;
        Ok(res)
    }

    db_entity_delete!("Space");
}

impl SpaceExt {
    pub async fn dataload_one<'c, X: sqlx::PgExecutor<'c> + Copy>(
        space: Space,
        db: X,
    ) -> Result<Self, Error> {
        let (channels, roles) =
            tokio::try_join!(Channel::list(space.id, db), Role::list(space.id, db))?;

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
