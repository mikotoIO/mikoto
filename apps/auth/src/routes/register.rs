use axum::Json;

use crate::{
    db::{db, muon},
    entities::User,
    error::Error,
};

#[derive(Deserialize)]
pub struct RegisterPayload {
    pub email: String,
    pub name: String,
    pub password: String,
}

pub async fn route(body: Json<RegisterPayload>) -> Result<(), Error> {
    // let _user: User = sqlx::query_as(r#"INSERT INTO "User" WHERE "account""#)
    //     .bind(&body.email)
    //     .fetch_one(db())
    //     .await?;
    let user = muon()
        .insert(&User {
            id: uuid::Uuid::new_v4(),
            name: body.name.clone(),
        })
        .await?;

    todo!()
}
