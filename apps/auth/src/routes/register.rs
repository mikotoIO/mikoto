use axum::Json;
use muonic::muon::muon;
use uuid::Uuid;

use crate::{db::db, entities::User, error::Error};

#[derive(Deserialize)]
pub struct RegisterPayload {
    pub email: String,
    pub name: String,
    pub password: String,
}

pub async fn route(body: Json<RegisterPayload>) -> Result<(), Error> {
    let mut tx = db().begin().await?;
    muon::<User>()
        .insert(
            &mut *tx,
            &User {
                id: uuid::Uuid::new_v4(),
                name: body.name.clone(),
            },
        )
        .await?;

    todo!()
}
