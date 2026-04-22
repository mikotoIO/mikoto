use axum::{http::HeaderMap, Json};
use schemars::JsonSchema;
use serde_json::json;
use uuid::Uuid;

use crate::{
    db::db,
    entities::{Account, Handle, RefreshToken, TokenPair},
    error::Error,
    functions::{
        jwt::{jwt_key, Claims},
        rate_limit::auth_rate_limiter,
        validation::validate_password,
    },
};

fn register_payload_example() -> serde_json::Value {
    json!({
        "email": "misaka.mikoto@tokiwadai.ac.jp",
        "name": "biribiri",
        "password": "correcthorsebatterystaple",
    })
}

#[derive(Deserialize, JsonSchema)]
#[serde(rename_all = "camelCase")]
#[schemars(example = "register_payload_example")]
pub struct RegisterPayload {
    pub email: String,
    pub name: String,
    pub password: String,
}

pub async fn route(
    headers: HeaderMap,
    body: Json<RegisterPayload>,
) -> Result<Json<TokenPair>, Error> {
    let ip = crate::functions::rate_limit::client_ip_from_headers(&headers);
    auth_rate_limiter().check(&ip)?;

    validate_password(&body.password)?;

    let account = Account {
        id: Uuid::new_v4(),
        email: body.email.clone(),
        passhash: bcrypt::hash(body.password.clone(), bcrypt::DEFAULT_COST)?,
    };

    account.create_with_user(&body.name, db()).await?;

    // Auto-assign a unique default handle for the new user
    let _ = Handle::auto_assign_for_user(account.id, &body.name, db()).await;

    let (refresh, token) = RefreshToken::new(account.id);
    refresh.create(db()).await?;

    Ok(Json(TokenPair {
        access_token: Claims::from(&account).encode(jwt_key())?,
        refresh_token: Some(token),
    }))
}
