use ::muonic::muon::col;
use axum::Json;
use muonic::muon;

use crate::{
    db::db,
    entities::{Account, RefreshToken},
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
    let acc: Account = muon::select()
        .where_(col("email").eq(&body.email))
        .one(db())
        .await?
        .ok_or(Error::NotFound)?;

    if !bcrypt::verify(&body.password, &acc.passhash)? {
        return Err(Error::WrongPassword);
    }

    let (refresh, token) = RefreshToken::new(acc.id);
    muon::insert(db(), &refresh).await?;
    Ok(Json(LoginResponse {
        access_token: UserClaims::from(acc).encode()?,
        refresh_token: token,
    }))
}
