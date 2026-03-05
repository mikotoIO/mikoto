use aide::axum::{
    routing::{get_with, post_with},
    ApiRouter,
};
use axum::Json;
use nanoid::nanoid;
use schemars::JsonSchema;
use uuid::Uuid;

use crate::{
    db::db,
    entities::{Bot, BotCreatedResponse},
    error::Error,
    functions::jwt::Claims,
};

pub fn router() -> ApiRouter {
    ApiRouter::<()>::new()
        .api_route(
            "/",
            get_with(list_bots, |o| {
                o.tag("Bots").id("bots.list").summary("List Bots")
            }),
        )
        .api_route(
            "/",
            post_with(create_bot, |o| {
                o.tag("Bots").id("bots.create").summary("Create a Bot")
            }),
        )
}

#[derive(Deserialize, JsonSchema)]
#[serde(rename_all = "camelCase")]
pub struct CreateBotPayload {
    pub name: String,
}

async fn create_bot(
    account: Claims,
    body: Json<CreateBotPayload>,
) -> Result<Json<BotCreatedResponse>, Error> {
    let plaintext_token = nanoid!(32);
    let hashed_secret = bcrypt::hash(&plaintext_token, bcrypt::DEFAULT_COST)?;

    let owner_id = Uuid::parse_str(&account.sub)?;
    let bot = Bot {
        id: Uuid::new_v4(),
        name: body.name.clone(),
        owner_id,
        secret: hashed_secret,
    };

    bot.create_with_user(&body.name, db()).await?;

    // Return the plaintext token only this once
    Ok(Json(BotCreatedResponse {
        id: bot.id,
        name: bot.name,
        owner_id: bot.owner_id,
        token: plaintext_token,
    }))
}

async fn list_bots(account: Claims) -> Result<Json<Vec<Bot>>, Error> {
    let bots = Bot::list(Uuid::parse_str(&account.sub)?, db()).await?;
    Ok(Json(bots))
}
