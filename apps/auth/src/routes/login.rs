use ::muonic::{muonic::col, sea_query::Expr};
use axum::Json;
use muonic::muonic;

use crate::{
    db::db,
    entities::{EmailAuth, RefreshToken, User},
    error::Error,
    functions::jwt::UserClaims,
};
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LoginPayload {
    pub email: String,
    pub password: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LoginResponse {
    pub access_token: String,
    pub refresh_token: String,
}

pub async fn route(body: Json<LoginPayload>) -> Result<Json<LoginResponse>, Error> {
    let cred: EmailAuth = muonic::select()
        .where_(col("email").eq(&body.email))
        .one(db())
        .await?
        .ok_or(Error::NotFound)?;

    if !bcrypt::verify(
        &body.password,
        &cred.passhash.ok_or(Error::WrongAuthenticationType)?,
    )? {
        return Err(Error::WrongPassword);
    }

    let user: User = muonic::select()
        .where_(col("id").eq(cred.id))
        .one(db())
        .await?
        .ok_or(Error::NotFound)?;

    let (refresh, token) = RefreshToken::new(user.id);
    muonic::insert(db(), &refresh).await?;
    Ok(Json(LoginResponse {
        access_token: UserClaims::from(user).encode()?,
        refresh_token: token,
    }))
}
