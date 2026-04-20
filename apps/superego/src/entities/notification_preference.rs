use uuid::Uuid;

use crate::{db_enum, entity, error::Error};

db_enum!(
    #[sqlx(type_name = "\"NotificationLevel\"")]
    pub enum NotificationLevel {
        All,
        Mentions,
        Nothing,
    }
);

entity!(
    pub struct NotificationPreference {
        pub user_id: Uuid,
        pub space_id: Uuid,
        pub level: NotificationLevel,
    }
);

impl NotificationPreference {
    pub async fn get<'c, X: sqlx::PgExecutor<'c>>(
        user_id: Uuid,
        space_id: Uuid,
        db: X,
    ) -> Result<Self, Error> {
        let pref: Option<Self> = sqlx::query_as(
            r##"
            SELECT * FROM "NotificationPreference"
            WHERE "userId" = $1 AND "spaceId" = $2
            "##,
        )
        .bind(user_id)
        .bind(space_id)
        .fetch_optional(db)
        .await?;
        Ok(pref.unwrap_or(Self {
            user_id,
            space_id,
            level: NotificationLevel::All,
        }))
    }

    pub async fn list_by_user<'c, X: sqlx::PgExecutor<'c>>(
        user_id: Uuid,
        db: X,
    ) -> Result<Vec<Self>, Error> {
        let prefs = sqlx::query_as(
            r##"
            SELECT * FROM "NotificationPreference"
            WHERE "userId" = $1
            "##,
        )
        .bind(user_id)
        .fetch_all(db)
        .await?;
        Ok(prefs)
    }

    pub async fn upsert<'c, X: sqlx::PgExecutor<'c>>(
        user_id: Uuid,
        space_id: Uuid,
        level: NotificationLevel,
        db: X,
    ) -> Result<Self, Error> {
        let pref = sqlx::query_as(
            r##"
            INSERT INTO "NotificationPreference" ("userId", "spaceId", "level")
            VALUES ($1, $2, $3)
            ON CONFLICT ("userId", "spaceId")
            DO UPDATE SET "level" = $3
            RETURNING *
            "##,
        )
        .bind(user_id)
        .bind(space_id)
        .bind(level)
        .fetch_one(db)
        .await?;
        Ok(pref)
    }
}
