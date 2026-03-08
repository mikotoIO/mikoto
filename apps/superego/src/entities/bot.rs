use chrono::{DateTime, Utc};
use uuid::Uuid;

use crate::{db_enum, db_find_by_id, entity, error::Error, model};

use super::UserExt;

db_enum!(
    #[sqlx(type_name = "\"BotVisibility\"")]
    pub enum BotVisibility {
        Public,
        Private,
    }
);

entity!(
    pub struct Bot {
        pub id: Uuid,
        pub name: String,
        pub owner_id: Uuid,

        #[serde(skip_serializing)]
        pub secret: String,

        pub visibility: BotVisibility,

        #[schemars(with = "Vec<String>")]
        pub permissions: serde_json::Value,

        pub last_token_regenerated_at: Option<DateTime<Utc>>,
    }
);

// Public bot info returned by list/detail endpoints (no secret)
model!(
    pub struct BotInfo {
        pub id: Uuid,
        pub name: String,
        pub owner_id: Uuid,
        pub visibility: BotVisibility,
        pub permissions: Vec<String>,
        pub last_token_regenerated_at: Option<DateTime<Utc>>,
        #[serde(skip_serializing_if = "Option::is_none")]
        pub user: Option<UserExt>,
    }
);

// Response returned only when creating a bot or regenerating a token.
// This is the only time the token is visible.
model!(
    pub struct BotCreatedResponse {
        pub id: Uuid,
        pub name: String,
        pub owner_id: Uuid,
        pub token: String,
    }
);

// Info about a space a bot is in
entity!(
    pub struct BotSpaceInfo {
        pub space_id: Uuid,
        pub space_name: String,
        pub space_icon: Option<String>,
    }
);

impl Bot {
    db_find_by_id!("Bot");

    pub async fn list<'c, X: sqlx::PgExecutor<'c>>(
        owner_id: Uuid,
        db: X,
    ) -> Result<Vec<Self>, Error> {
        let bots = sqlx::query_as(r#"SELECT * FROM "Bot" WHERE "ownerId" = $1"#)
            .bind(owner_id)
            .fetch_all(db)
            .await?;
        Ok(bots)
    }

    pub async fn create<'c, X: sqlx::PgExecutor<'c>>(&self, db: X) -> Result<(), Error> {
        sqlx::query(
            r##"
            INSERT INTO "Bot" ("id", "name", "ownerId", "secret")
            VALUES ($1, $2, $3, $4)
            "##,
        )
        .bind(self.id)
        .bind(&self.name)
        .bind(self.owner_id)
        .bind(&self.secret)
        .execute(db)
        .await?;
        Ok(())
    }

    pub async fn create_with_user<'c, X: sqlx::PgExecutor<'c>>(
        &self,
        name: &str,
        db: X,
    ) -> Result<(), Error> {
        sqlx::query(
            r##"
            WITH u AS (
                INSERT INTO "User" ("id", "name", "category")
                VALUES ($1, $2, 'BOT')
                RETURNING "id"
            )
            INSERT INTO "Bot" ("id", "name", "ownerId", "secret")
            VALUES ((SELECT "id" FROM u), $3, $4, $5)
            "##,
        )
        .bind(self.id)
        .bind(name)
        .bind(&self.name)
        .bind(self.owner_id)
        .bind(&self.secret)
        .execute(db)
        .await?;
        Ok(())
    }

    pub async fn delete<'c, X: sqlx::PgExecutor<'c>>(id: Uuid, db: X) -> Result<(), Error> {
        sqlx::query(r#"DELETE FROM "Bot" WHERE "id" = $1"#)
            .bind(id)
            .execute(db)
            .await?;
        Ok(())
    }

    pub async fn update_settings<'c, X: sqlx::PgExecutor<'c>>(
        id: Uuid,
        visibility: BotVisibility,
        permissions: &[String],
        db: X,
    ) -> Result<Self, Error> {
        sqlx::query_as(
            r##"
            UPDATE "Bot"
            SET "visibility" = $2, "permissions" = $3
            WHERE "id" = $1
            RETURNING *
            "##,
        )
        .bind(id)
        .bind(visibility)
        .bind(serde_json::to_value(permissions).unwrap_or_default())
        .fetch_optional(db)
        .await?
        .ok_or(Error::NotFound)
    }

    pub async fn regenerate_secret<'c, X: sqlx::PgExecutor<'c>>(
        id: Uuid,
        hashed_secret: &str,
        db: X,
    ) -> Result<Self, Error> {
        sqlx::query_as(
            r##"
            UPDATE "Bot"
            SET "secret" = $2, "lastTokenRegeneratedAt" = NOW()
            WHERE "id" = $1
            RETURNING *
            "##,
        )
        .bind(id)
        .bind(hashed_secret)
        .fetch_optional(db)
        .await?
        .ok_or(Error::NotFound)
    }

    pub fn to_info(&self) -> BotInfo {
        let permissions: Vec<String> =
            serde_json::from_value(self.permissions.clone()).unwrap_or_default();
        BotInfo {
            id: self.id,
            name: self.name.clone(),
            owner_id: self.owner_id,
            visibility: self.visibility,
            permissions,
            last_token_regenerated_at: self.last_token_regenerated_at,
            user: None,
        }
    }

    pub async fn to_info_with_user<'c, X: sqlx::PgExecutor<'c> + Copy>(
        &self,
        db: X,
    ) -> Result<BotInfo, Error> {
        let user = super::User::find_by_id(self.id, db).await.ok();
        let user = match user {
            Some(u) => Some(UserExt::from_user(u, db).await?),
            None => None,
        };
        let mut info = self.to_info();
        info.user = user;
        Ok(info)
    }

    pub async fn list_spaces<'c, X: sqlx::PgExecutor<'c>>(
        bot_id: Uuid,
        db: X,
    ) -> Result<Vec<BotSpaceInfo>, Error> {
        let spaces: Vec<BotSpaceInfo> = sqlx::query_as(
            r##"
            SELECT s."id" AS "spaceId", s."name" AS "spaceName", s."icon" AS "spaceIcon"
            FROM "SpaceUser" su
            JOIN "Space" s ON s."id" = su."spaceId"
            WHERE su."userId" = $1
            "##,
        )
        .bind(bot_id)
        .fetch_all(db)
        .await?;
        Ok(spaces)
    }
}
