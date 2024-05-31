use axum::Json;
use muonic::muon;
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
    muon::insert(db(), &user).await?;

    Ok(Json(user))
}
