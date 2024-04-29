use axum::Json;

use crate::{
    db::db,
    entities::{EmailAuth, User},
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
    let cred: EmailAuth = sqlx::query_as(r#"SELECT * FROM "EmailAuth" WHERE email = $1"#)
        .bind(&body.email)
        .fetch_optional(db())
        .await?
        .ok_or(Error::NotFound)?;
    if !bcrypt::verify(
        &body.password,
        &cred.passhash.ok_or(Error::WrongAuthenticationType)?,
    )? {
        return Err(Error::WrongPassword);
    }

    let user: User = sqlx::query_as(r#"SELECT * FROM "User" WHERE id = $1"#)
        .bind(&cred.id)
        .fetch_optional(db())
        .await?
        .ok_or(Error::NotFound)?;

    Ok(Json(LoginResponse {
        access_token: UserClaims::from(user).encode()?,
        refresh_token: "".to_string(),
    }))
}
