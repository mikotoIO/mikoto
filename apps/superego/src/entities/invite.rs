use chrono::NaiveDateTime;
use uuid::Uuid;

use crate::{entity, error::Error};

entity!(
    pub struct Invite {
        pub id: String, // Not UUID, but a NanoID
        pub space_id: Uuid,
        pub created_at: NaiveDateTime,
        pub creator_id: Uuid,
    }
);

impl Invite {
    // can't use db_find_by_id because the id is a string
    pub async fn find_by_id<'c, X: sqlx::PgExecutor<'c>>(id: &str, db: X) -> Result<Self, Error> {
        let res = sqlx::query_as(
            r#"
            SELECT * FROM "Invite" WHERE "id" = $1
            "#,
        )
        .bind(id)
        .fetch_optional(db)
        .await?
        .ok_or(Error::NotFound)?;
        Ok(res)
    }
}
