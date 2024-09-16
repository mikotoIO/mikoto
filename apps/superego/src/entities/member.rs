use schemars::JsonSchema;
use uuid::Uuid;

use crate::{entity, error::Error, model};

use super::User;

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
    pub user: User,
    pub role_ids: Vec<Uuid>,
}

model!(
    pub struct MemberKey {
        pub space_id: Uuid,
        pub user_id: Uuid,
    }
);

impl SpaceUser {
    pub fn new(space_id: Uuid, user_id: Uuid) -> Self {
        Self {
            id: Uuid::new_v4(),
            space_id,
            user_id,
            name: None,
        }
    }

    pub async fn create<'c, X: sqlx::PgExecutor<'c>>(&self, db: X) -> Result<(), Error> {
        sqlx::query(
            r##"
            INSERT INTO "SpaceUser" ("id", "spaceId", "userId", "name")
            VALUES ($1, $2, $3, $4)
            "##,
        )
        .bind(&self.id)
        .bind(&self.space_id)
        .bind(&self.user_id)
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
        .bind(&key.space_id)
        .bind(&key.user_id)
        .execute(db)
        .await?;
        Ok(())
    }
}

impl MemberExt {
    pub async fn dataload_one<'c, X: sqlx::PgExecutor<'c>>(
        base: SpaceUser,
        db: X,
    ) -> Result<Self, Error> {
        let user = User::find_by_id(base.user_id, db).await?;

        Ok(Self {
            base,
            user,
            role_ids: vec![], // TODO: dataload roles
        })
    }
}
