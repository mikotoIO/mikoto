use axum::Json;
use schemars::JsonSchema;
use serde_json::json;

use crate::{
    db::db,
    entities::{Account, RefreshToken, TokenPair},
    error::Error,
    functions::jwt::{jwt_key, Claims},
};

fn login_payload_example() -> serde_json::Value {
    json!({
        "email": "misaka.mikoto@tokiwadai.ac.jp",
        "password": "correcthorsebatterystaple",
    })
}

#[derive(Deserialize, JsonSchema)]
#[serde(rename_all = "camelCase")]
#[schemars(example = "login_payload_example")]
pub struct LoginPayload {
    pub email: String,
    pub password: String,
}

pub async fn route(body: Json<LoginPayload>) -> Result<Json<TokenPair>, Error> {
    let acc = Account::find_by_email(&body.email, db()).await?;

    if !bcrypt::verify(&body.password, &acc.passhash)? {
        return Err(Error::WrongPassword);
    }

    let (refresh, token) = RefreshToken::new(acc.id);
    refresh.create(db()).await?;

    Ok(Json(TokenPair {
        access_token: Claims::from(&acc).encode(jwt_key())?,
        refresh_token: token,
    }))
}
