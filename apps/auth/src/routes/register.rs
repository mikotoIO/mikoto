use axum::Json;
use uuid::Uuid;

use crate::{db::db, entities::Account, error::Error};

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RegisterPayload {
    pub email: String,
    pub name: String,
    pub password: String,
}

pub async fn route(body: Json<RegisterPayload>) -> Result<Json<Account>, Error> {
    let user = Account {
        id: Uuid::new_v4(),
        email: body.email.clone(),
        passhash: bcrypt::hash(body.password.clone(), bcrypt::DEFAULT_COST)?,
    };
    // write a sqlx query to insert the user into the database - no macros yet
    sqlx::query(r##"INSERT INTO "Accounts" ("id", "email", "passhash") VALUES ($1, $2, $3)"##)
        .bind(&user.id)
        .bind(&user.email)
        .bind(&user.passhash)
        .execute(db())
        .await?;
    Ok(Json(user))
}
