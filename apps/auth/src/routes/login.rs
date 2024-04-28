use axum::Json;
use muonic::muon::muon;

use crate::{entities::EmailAuth, error::Error};

pub struct LoginPayload {
    pub email: String,
    pub password: String,
}

pub async fn route(body: Json<LoginPayload>) -> Result<(), Error> {
    muon::<EmailAuth>();
    todo!()
}
