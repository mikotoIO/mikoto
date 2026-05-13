use aide::axum::routing::{delete_with, get_with, patch_with, post_with};
use axum::{extract::Path, Json};
use schemars::JsonSchema;
use uuid::Uuid;

use crate::{
    db::db,
    entities::{Emoji, MemberExt, SpaceExt},
    error::Error,
    functions::{
        jwt::Claims,
        permissions::{permissions_or_admin, Permission},
        pubsub::emit_event,
    },
    middlewares::load::Load,
    routes::{router::AppRouter, ws::state::State},
};

#[derive(Deserialize, JsonSchema)]
#[serde(rename_all = "camelCase")]
pub struct EmojiCreatePayload {
    pub name: String,
    pub url: String,
}

#[derive(Deserialize, JsonSchema)]
#[serde(rename_all = "camelCase")]
pub struct EmojiUpdatePayload {
    pub name: String,
}

fn validate_name(name: &str) -> Result<(), Error> {
    let len = name.chars().count();
    if !(2..=32).contains(&len) {
        return Err(Error::ValidationFailed);
    }
    if !name
        .chars()
        .all(|c| c.is_ascii_alphanumeric() || c == '_' || c == '-')
    {
        return Err(Error::ValidationFailed);
    }
    Ok(())
}

async fn list(
    _claim: Claims,
    _member: Load<MemberExt>,
    Path(space_id): Path<Uuid>,
) -> Result<Json<Vec<Emoji>>, Error> {
    let emojis = Emoji::list_by_space(space_id, db()).await?;
    Ok(emojis.into())
}

async fn create(
    claim: Claims,
    Load(space): Load<SpaceExt>,
    Load(member): Load<MemberExt>,
    Path(space_id): Path<Uuid>,
    Json(body): Json<EmojiCreatePayload>,
) -> Result<Json<Emoji>, Error> {
    permissions_or_admin(&space, &member, Permission::MANAGE_EMOJIS)?;
    validate_name(&body.name)?;

    let user_id: Uuid = claim.sub.parse()?;
    let emoji = Emoji::new(space_id, body.name, body.url, user_id);
    emoji.create(db()).await?;

    emit_event(
        "emojis.onCreate",
        &emoji,
        &format!("space:{}", space.base.id),
    )
    .await?;
    Ok(emoji.into())
}

async fn update(
    Path((_space_id, emoji_id)): Path<(Uuid, Uuid)>,
    Load(space): Load<SpaceExt>,
    Load(member): Load<MemberExt>,
    Json(body): Json<EmojiUpdatePayload>,
) -> Result<Json<Emoji>, Error> {
    permissions_or_admin(&space, &member, Permission::MANAGE_EMOJIS)?;
    validate_name(&body.name)?;

    let emoji = Emoji::find_by_id(emoji_id, db()).await?;
    if emoji.space_id != space.base.id {
        return Err(Error::NotFound);
    }
    let emoji = emoji.rename(&body.name, db()).await?;

    emit_event(
        "emojis.onUpdate",
        &emoji,
        &format!("space:{}", space.base.id),
    )
    .await?;
    Ok(emoji.into())
}

async fn delete(
    Path((_space_id, emoji_id)): Path<(Uuid, Uuid)>,
    Load(space): Load<SpaceExt>,
    Load(member): Load<MemberExt>,
) -> Result<Json<()>, Error> {
    permissions_or_admin(&space, &member, Permission::MANAGE_EMOJIS)?;

    let emoji = Emoji::find_by_id(emoji_id, db()).await?;
    if emoji.space_id != space.base.id {
        return Err(Error::NotFound);
    }
    emoji.delete(db()).await?;

    emit_event(
        "emojis.onDelete",
        &emoji,
        &format!("space:{}", space.base.id),
    )
    .await?;
    Ok(Json(()))
}

static TAG: &str = "Emojis";

pub fn router() -> AppRouter<State> {
    AppRouter::new()
        .route(
            "/",
            get_with(list, |o| {
                o.tag(TAG).id("emojis.list").summary("List Emojis")
            }),
        )
        .route(
            "/",
            post_with(create, |o| {
                o.tag(TAG).id("emojis.create").summary("Create Emoji")
            }),
        )
        .route(
            "/:emojiId",
            patch_with(update, |o| {
                o.tag(TAG).id("emojis.update").summary("Update Emoji")
            }),
        )
        .route(
            "/:emojiId",
            delete_with(delete, |o| {
                o.tag(TAG).id("emojis.delete").summary("Delete Emoji")
            }),
        )
        .ws_event("onCreate", |emoji: Emoji, _| async move { Some(emoji) })
        .ws_event("onUpdate", |emoji: Emoji, _| async move { Some(emoji) })
        .ws_event("onDelete", |emoji: Emoji, _| async move { Some(emoji) })
}
