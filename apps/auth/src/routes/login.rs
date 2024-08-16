use axum::Json;

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
    let acc: Account = sqlx::query_as(r##"SELECT * FROM "Accounts" WHERE "email" = $1"##)
        .bind(&body.email)
        .fetch_one(db())
        .await?;

    if !bcrypt::verify(&body.password, &acc.passhash)? {
        return Err(Error::WrongPassword);
    }

    let (refresh, token) = RefreshToken::new(acc.id);
    sqlx::query(
        r##"
        INSERT INTO "RefreshTokens" ("id", "token", "expires_at", "account_id")
        VALUES ($1, $2, $3, $4)
        "##,
    )
    .bind(&refresh.id)
    .bind(&refresh.token)
    .bind(&refresh.expires_at)
    .bind(&refresh.account_id)
    .execute(db())
    .await?;
    Ok(Json(LoginResponse {
        access_token: UserClaims::from(acc).encode()?,
        refresh_token: token,
    }))
}
