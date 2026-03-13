use aide::axum::{
    routing::{delete_with, get_with, patch_with, post_with},
    ApiRouter,
};
use axum::{extract::Path, Json};
use nanoid::nanoid;
use schemars::JsonSchema;
use uuid::Uuid;

use crate::{
    db::db,
    entities::{
        Bot, BotCreatedResponse, BotInfo, BotSpaceInfo, BotVisibility, MemberExt, MemberKey, Space,
        SpaceExt, SpaceUser, TokenPair, User, UserPatch,
    },
    error::Error,
    functions::{
        jwt::{jwt_key, Claims},
        pubsub::emit_event,
    },
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
        .api_route(
            "/:botId",
            get_with(get_bot, |o| {
                o.tag("Bots").id("bots.get").summary("Get Bot Details")
            }),
        )
        .api_route(
            "/:botId",
            patch_with(update_bot, |o| {
                o.tag("Bots").id("bots.update").summary("Update Bot")
            }),
        )
        .api_route(
            "/:botId",
            delete_with(delete_bot, |o| {
                o.tag("Bots").id("bots.delete").summary("Delete Bot")
            }),
        )
        .api_route(
            "/:botId/regenerate-token",
            post_with(regenerate_token, |o| {
                o.tag("Bots")
                    .id("bots.regenerateToken")
                    .summary("Regenerate Bot Token")
            }),
        )
        .api_route(
            "/:botId/spaces",
            get_with(list_bot_spaces, |o| {
                o.tag("Bots")
                    .id("bots.listSpaces")
                    .summary("List Spaces Bot Is In")
            }),
        )
        .api_route(
            "/:botId/install",
            post_with(install_bot, |o| {
                o.tag("Bots")
                    .id("bots.install")
                    .summary("Install Bot Into Space")
            }),
        )
        .api_route(
            "/:botId/spaces/:spaceId",
            delete_with(remove_bot_from_space, |o| {
                o.tag("Bots")
                    .id("bots.removeFromSpace")
                    .summary("Remove Bot From Space")
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

#[derive(Deserialize, JsonSchema)]
#[serde(rename_all = "camelCase")]
pub struct UpdateBotPayload {
    pub name: Option<String>,
    pub description: Option<String>,
    pub avatar: Option<String>,
    pub visibility: Option<BotVisibility>,
    pub permissions: Option<Vec<String>>,
}

#[derive(Deserialize, JsonSchema)]
#[serde(rename_all = "camelCase")]
pub struct InstallBotPayload {
    pub space_id: Uuid,
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
        visibility: BotVisibility::Private,
        permissions: serde_json::Value::Array(vec![]),
        last_token_regenerated_at: None,
    };

    bot.create_with_user(&body.name, db()).await?;

    Ok(Json(BotCreatedResponse {
        id: bot.id,
        name: bot.name,
        owner_id: bot.owner_id,
        token: plaintext_token,
    }))
}

async fn list_bots(account: Claims) -> Result<Json<Vec<BotInfo>>, Error> {
    let bots = Bot::list(Uuid::parse_str(&account.sub)?, db()).await?;
    let mut infos = Vec::with_capacity(bots.len());
    for bot in &bots {
        infos.push(bot.to_info_with_user(db()).await?);
    }
    Ok(Json(infos))
}

async fn get_bot(account: Claims, Path(bot_id): Path<Uuid>) -> Result<Json<BotInfo>, Error> {
    let bot = Bot::find_by_id(bot_id, db()).await?;
    let owner_id = Uuid::parse_str(&account.sub)?;
    if bot.owner_id != owner_id {
        return Err(Error::forbidden("You do not own this bot"));
    }
    Ok(Json(bot.to_info_with_user(db()).await?))
}

async fn update_bot(
    account: Claims,
    Path(bot_id): Path<Uuid>,
    body: Json<UpdateBotPayload>,
) -> Result<Json<BotInfo>, Error> {
    let bot = Bot::find_by_id(bot_id, db()).await?;
    let owner_id = Uuid::parse_str(&account.sub)?;
    if bot.owner_id != owner_id {
        return Err(Error::forbidden("You do not own this bot"));
    }

    // Update the bot's User record if name/description/avatar provided
    if body.name.is_some() || body.description.is_some() || body.avatar.is_some() {
        let user = User::find_by_id(bot_id, db()).await?;
        user.update(
            UserPatch {
                name: body.name.clone(),
                avatar: body.avatar.clone(),
                description: body.description.clone(),
            },
            db(),
        )
        .await?;
    }

    // Update bot settings if visibility/permissions provided
    if body.visibility.is_some() || body.permissions.is_some() {
        let visibility = body.visibility.unwrap_or(bot.visibility);
        let permissions: Vec<String> = body
            .permissions
            .clone()
            .unwrap_or_else(|| serde_json::from_value(bot.permissions.clone()).unwrap_or_default());
        Bot::update_settings(bot_id, visibility, &permissions, db()).await?;
    }

    // Re-fetch to get the latest state
    let updated = Bot::find_by_id(bot_id, db()).await?;
    Ok(Json(updated.to_info_with_user(db()).await?))
}

async fn delete_bot(account: Claims, Path(bot_id): Path<Uuid>) -> Result<Json<()>, Error> {
    let bot = Bot::find_by_id(bot_id, db()).await?;
    let owner_id = Uuid::parse_str(&account.sub)?;
    if bot.owner_id != owner_id {
        return Err(Error::forbidden("You do not own this bot"));
    }
    Bot::delete(bot_id, db()).await?;
    Ok(Json(()))
}

async fn regenerate_token(
    account: Claims,
    Path(bot_id): Path<Uuid>,
) -> Result<Json<BotCreatedResponse>, Error> {
    let bot = Bot::find_by_id(bot_id, db()).await?;
    let owner_id = Uuid::parse_str(&account.sub)?;
    if bot.owner_id != owner_id {
        return Err(Error::forbidden("You do not own this bot"));
    }

    let plaintext_token = nanoid!(32);
    let hashed_secret = bcrypt::hash(&plaintext_token, bcrypt::DEFAULT_COST)?;
    let updated = Bot::regenerate_secret(bot_id, &hashed_secret, db()).await?;

    Ok(Json(BotCreatedResponse {
        id: updated.id,
        name: updated.name,
        owner_id: updated.owner_id,
        token: plaintext_token,
    }))
}

async fn list_bot_spaces(
    account: Claims,
    Path(bot_id): Path<Uuid>,
) -> Result<Json<Vec<BotSpaceInfo>>, Error> {
    let bot = Bot::find_by_id(bot_id, db()).await?;
    let owner_id = Uuid::parse_str(&account.sub)?;
    if bot.owner_id != owner_id {
        return Err(Error::forbidden("You do not own this bot"));
    }
    let spaces = Bot::list_spaces(bot_id, db()).await?;
    Ok(Json(spaces))
}

async fn install_bot(
    account: Claims,
    Path(bot_id): Path<Uuid>,
    body: Json<InstallBotPayload>,
) -> Result<Json<()>, Error> {
    let bot = Bot::find_by_id(bot_id, db()).await?;
    let owner_id = Uuid::parse_str(&account.sub)?;
    if bot.owner_id != owner_id {
        return Err(Error::forbidden("You do not own this bot"));
    }

    // Check if bot is already in the space
    let existing = SpaceUser::get_by_key(&MemberKey::new(body.space_id, bot_id), db()).await;
    if existing.is_ok() {
        return Err(Error::BadRequest);
    }

    let space_user = SpaceUser::new(body.space_id, bot_id);
    space_user.create(db()).await?;

    // Emit the same events as join_space so the bot's WS connection
    // auto-subscribes to the new space and all clients see the new member.
    let member = MemberExt::dataload_one(space_user, db()).await?;
    let space = Space::find_by_id(body.space_id, db()).await?;
    let space = SpaceExt::dataload_one(space, db()).await?;

    emit_event(
        "members.onCreate",
        &member,
        &format!("space:{}", body.space_id),
    )
    .await?;
    emit_event("spaces.onCreate", &space, &format!("user:{bot_id}")).await?;

    Ok(Json(()))
}

async fn remove_bot_from_space(
    account: Claims,
    Path((bot_id, space_id)): Path<(Uuid, Uuid)>,
) -> Result<Json<()>, Error> {
    let bot = Bot::find_by_id(bot_id, db()).await?;
    let owner_id = Uuid::parse_str(&account.sub)?;
    if bot.owner_id != owner_id {
        return Err(Error::forbidden("You do not own this bot"));
    }

    let key = MemberKey::new(space_id, bot_id);
    let space_user = SpaceUser::get_by_key(&key, db()).await?;
    let member = MemberExt::dataload_one(space_user, db()).await?;
    let space = Space::find_by_id(space_id, db()).await?;
    let space = SpaceExt::dataload_one(space, db()).await?;

    SpaceUser::delete_by_key(&key, db()).await?;

    emit_event("members.onDelete", &member, &format!("space:{space_id}")).await?;
    emit_event("spaces.onDelete", &space, &format!("user:{bot_id}")).await?;

    Ok(Json(()))
}
