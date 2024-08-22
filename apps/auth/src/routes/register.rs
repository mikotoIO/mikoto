use axum::Json;
use schemars::JsonSchema;
use serde_json::json;
use uuid::Uuid;

use crate::{
    db::db,
    entities::{user_create, Account},
    error::Error,
    functions::captcha::captcha,
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

pub async fn route(body: Json<RegisterPayload>) -> Result<Json<Account>, Error> {
    captcha().validate(body.captcha.as_deref()).await?;

    let account = Account {
        id: Uuid::new_v4(),
        email: body.email.clone(),
        passhash: bcrypt::hash(body.password.clone(), bcrypt::DEFAULT_COST)?,
    };

    let mut tx = db().begin().await?;
    user_create(&account.id, &body.name, &mut *tx).await?;
    account.create(&mut *tx).await?;
    tx.commit().await?;
    Ok(Json(account))
}
