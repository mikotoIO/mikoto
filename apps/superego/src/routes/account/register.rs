use axum::Json;
use schemars::JsonSchema;
use serde_json::json;
use uuid::Uuid;

use crate::{
    db::db,
    entities::{Account, RefreshToken, TokenPair},
    error::Error,
    functions::{
        captcha::captcha,
        jwt::{jwt_key, Claims},
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
    pub captcha: Option<String>,
}

pub async fn route(body: Json<RegisterPayload>) -> Result<Json<TokenPair>, Error> {
    captcha().validate(body.captcha.as_deref()).await?;

    let account = Account {
        id: Uuid::new_v4(),
        email: body.email.clone(),
        passhash: bcrypt::hash(body.password.clone(), bcrypt::DEFAULT_COST)?,
    };

    account.create_with_user(&body.name, db()).await?;

    let (refresh, token) = RefreshToken::new(account.id);
    refresh.create(db()).await?;

    Ok(Json(TokenPair {
        access_token: Claims::from(&account).encode(jwt_key())?,
        refresh_token: Some(token),
    }))
}
