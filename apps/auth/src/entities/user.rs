// TODO: Delete this at later point
// Accounts and Users are too intertwined right now, but the auth service
// should only handle Accounts - the main app should handle Users

use uuid::Uuid;

use crate::error::Error;

pub async fn user_create<'c, X: sqlx::PgExecutor<'c>>(
    id: &Uuid,
    name: &str,
    db: X,
) -> Result<(), Error> {
    sqlx::query(
        r##"
        INSERT INTO "User" ("id", "name")
        VALUES ($1, $2)
        "##,
    )
    .bind(&id)
    .bind(&name)
    .execute(db)
    .await?;
    Ok(())
}

pub async fn bot_create<'c, X: sqlx::PgExecutor<'c>>(
    id: &Uuid,
    name: &str,
    db: X,
) -> Result<(), Error> {
    sqlx::query(
        r##"
        INSERT INTO "User" ("id", "name", "category")
        VALUES ($1, $2, $3)
        "##,
    )
    .bind(&id)
    .bind(&name)
    .bind("BOT")
    .execute(db)
    .await?;
    Ok(())
}
