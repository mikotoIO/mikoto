use axum::Json;

use crate::{db::db, error::Error};

#[derive(Deserialize)]
pub struct RegisterPayload {
    pub email: String,
    pub name: String,
    pub password: String,
}

pub async fn route(body: Json<RegisterPayload>) -> Result<(), Error> {
    let db = db();
    todo!()
}
