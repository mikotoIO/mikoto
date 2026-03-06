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
    entities::{Bot, BotCreatedResponse, BotInfo, TokenPair},
    error::Error,
    functions::jwt::{jwt_key, Claims},
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
        .api_route(
            "/login",
            post_with(bot_login, |o| {
                o.tag("Bots")
                    .id("bots.login")
                    .summary("Authenticate as Bot")
                    .description("Exchange a bot ID and secret token for a JWT access token.")
            }),
        )
}

#[derive(Deserialize, JsonSchema)]
#[serde(rename_all = "camelCase")]
pub struct CreateBotPayload {
    pub name: String,
}

#[derive(Deserialize, JsonSchema)]
#[serde(rename_all = "camelCase")]
pub struct BotLoginPayload {
    pub bot_id: Uuid,
    pub token: String,
}

async fn bot_login(body: Json<BotLoginPayload>) -> Result<Json<TokenPair>, Error> {
    let bot = Bot::find_by_id(body.bot_id, db())
        .await
        .map_err(|e| match e {
            Error::NotFound => Error::unauthorized("Invalid bot credentials"),
            other => other,
        })?;

    if !bcrypt::verify(&body.token, &bot.secret)? {
        return Err(Error::unauthorized("Invalid bot credentials"));
    }

    let access_token = Claims::for_bot(bot.id).encode(jwt_key())?;

    Ok(Json(TokenPair {
        access_token,
        refresh_token: None,
    }))
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

async fn list_bots(account: Claims) -> Result<Json<Vec<BotInfo>>, Error> {
    let bots = Bot::list(Uuid::parse_str(&account.sub)?, db()).await?;
    let bots = bots
        .into_iter()
        .map(|b| BotInfo {
            id: b.id,
            name: b.name,
            owner_id: b.owner_id,
        })
        .collect();
    Ok(Json(bots))
}
