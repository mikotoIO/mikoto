use axum::Json;
use nanoid::nanoid;
use schemars::JsonSchema;
use uuid::Uuid;

use crate::{db::db, entities::Bot, error::Error, functions::jwt::Claims};

#[derive(Deserialize, JsonSchema)]
#[serde(rename_all = "camelCase")]
pub struct CreateBotPayload {
    pub name: String,
}

// FIXME: the API keys should be hashed as well
pub async fn create_bot(account: Claims, body: Json<CreateBotPayload>) -> Result<Json<Bot>, Error> {
    let random_token = nanoid!(32);

    let bot = Bot {
        id: Uuid::new_v4(),
        name: body.name.clone(),
        owner_id: Uuid::parse_str(&account.sub)?,
        secret: random_token,
    };

    bot.create_with_user(&body.name, db()).await?;
    Ok(Json(bot))
}

pub async fn list_bots(account: Claims) -> Result<Json<Vec<Bot>>, Error> {
    let bots = Bot::list(Uuid::parse_str(&account.sub)?, db()).await?;
    Ok(Json(bots))
}
