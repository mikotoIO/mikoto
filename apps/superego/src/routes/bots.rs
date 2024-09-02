use aide::axum::{
    routing::{get_with, post_with},
    ApiRouter,
};
use axum::Json;
use nanoid::nanoid;
use schemars::JsonSchema;
use uuid::Uuid;

use crate::{db::db, entities::Bot, error::Error, functions::jwt::Claims};

pub fn router() -> ApiRouter {
    ApiRouter::<()>::new()
        .api_route(
            "/",
            get_with(list_bots, |o| o.tag("Bots").summary("List Bots")),
        )
        .api_route(
            "/",
            post_with(create_bot, |o| o.tag("Bots").summary("Create a Bot")),
        )
}

#[derive(Deserialize, JsonSchema)]
#[serde(rename_all = "camelCase")]
pub struct CreateBotPayload {
    pub name: String,
}

// FIXME: the API keys should be hashed as well
async fn create_bot(account: Claims, body: Json<CreateBotPayload>) -> Result<Json<Bot>, Error> {
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

async fn list_bots(account: Claims) -> Result<Json<Vec<Bot>>, Error> {
    let bots = Bot::list(Uuid::parse_str(&account.sub)?, db()).await?;
    Ok(Json(bots))
}
