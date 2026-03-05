use axum::Json;
use schemars::JsonSchema;
use serde_json::json;

use axum::http::HeaderMap;

use crate::{
    db::db,
    entities::{Account, RefreshToken, TokenPair},
    error::Error,
    functions::{
        jwt::{jwt_key, Claims},
        rate_limit::auth_rate_limiter,
    },
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

pub async fn route(headers: HeaderMap, body: Json<LoginPayload>) -> Result<Json<TokenPair>, Error> {
    let ip = crate::functions::rate_limit::client_ip_from_headers(&headers);
    auth_rate_limiter().check(&ip)?;

    let acc = match Account::find_by_email(&body.email, db()).await {
        Ok(acc) => acc,
        Err(Error::NotFound) => return Err(Error::WrongPassword),
        Err(e) => return Err(e),
    };

    if !bcrypt::verify(&body.password, &acc.passhash)? {
        return Err(Error::WrongPassword);
    }

    let (refresh, token) = RefreshToken::new(acc.id);
    refresh.create(db()).await?;

    Ok(Json(TokenPair {
        access_token: Claims::from(&acc).encode(jwt_key())?,
        refresh_token: Some(token),
    }))
}
