use axum::Json;
use muonic::muonic;
use uuid::Uuid;

use crate::{
    db::db,
    entities::{EmailAuth, User},
    error::Error,
};

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RegisterPayload {
    pub email: String,
    pub name: String,
    pub password: String,
}

pub async fn route(body: Json<RegisterPayload>) -> Result<Json<User>, Error> {
    let mut tx = db().begin().await?;
    let user = User {
        id: Uuid::new_v4(),
        name: body.name.clone(),
    };
    muonic::insert(&mut *tx, &user).await?;

    let email_auth = EmailAuth {
        id: user.id,
        email: body.email.clone(),
        passhash: Some(bcrypt::hash(body.password.clone(), bcrypt::DEFAULT_COST)?),
    };
    muonic::insert(&mut *tx, &email_auth).await?;

    tx.commit().await?;
    Ok(Json(user))
}
