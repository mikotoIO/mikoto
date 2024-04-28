use axum::Json;

use crate::{db::db, entities::User, error::Error};

#[derive(Deserialize)]
pub struct RegisterPayload {
    pub email: String,
    pub name: String,
    pub password: String,
}

pub async fn route(body: Json<RegisterPayload>) -> Result<(), Error> {
    let user: User = sqlx::query_as(r#"SELECT * FROM "user""#)
        .fetch_one(db())
        .await?;

    todo!()
}
