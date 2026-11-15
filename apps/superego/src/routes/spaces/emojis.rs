use aide::axum::routing::{delete_with, get_with, patch_with, post_with};
use axum::{extract::Path, Json};
use uuid::Uuid;

use crate::{
    db::db,
    entities::{
        validate_emoji_image, validate_emoji_name, Emoji, EmojiCreatePayload, EmojiPatch,
        MemberExt, SpaceExt, MAX_EMOJIS_PER_SPACE,
    },
    error::Error,
    functions::{
        jwt::Claims,
        permissions::{permissions_or_admin, Permission},
        pubsub::emit_event,
    },
    middlewares::load::Load,
    routes::{router::AppRouter, ws::state::State},
};

async fn find_in_space(space: &SpaceExt, emoji_id: Uuid) -> Result<Emoji, Error> {
    let emoji = Emoji::find_by_id(emoji_id, db()).await?;
    if emoji.space_id != space.base.id {
        return Err(Error::NotFound);
    }
    Ok(emoji)
}

async fn list(
    _claim: Claims,
    _member: Load<MemberExt>,
    Load(space): Load<SpaceExt>,
) -> Result<Json<Vec<Emoji>>, Error> {
    Ok(space.emojis.into())
}

async fn create(
    claim: Claims,
    Load(space): Load<SpaceExt>,
    Load(member): Load<MemberExt>,
    Json(body): Json<EmojiCreatePayload>,
) -> Result<Json<Emoji>, Error> {
    permissions_or_admin(&space, &member, Permission::MANAGE_EMOJIS)?;
    validate_emoji_name(&body.name)?;
    validate_emoji_image(&body.image)?;
    if Emoji::count_in_space(space.base.id, db()).await? >= MAX_EMOJIS_PER_SPACE {
        return Err(Error::new(
            "TooManyEmojis",
            axum::http::StatusCode::BAD_REQUEST,
            &format!("A space can have at most {MAX_EMOJIS_PER_SPACE} custom emoji"),
        ));
    }

    let emoji = Emoji {
        id: Uuid::new_v4(),
        space_id: space.base.id,
        name: body.name,
        image: body.image,
        creator_id: Some(claim.sub.parse()?),
    };
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
    Path((_, emoji_id)): Path<(Uuid, Uuid)>,
    Load(space): Load<SpaceExt>,
    Load(member): Load<MemberExt>,
    Json(patch): Json<EmojiPatch>,
) -> Result<Json<Emoji>, Error> {
    permissions_or_admin(&space, &member, Permission::MANAGE_EMOJIS)?;
    validate_emoji_name(&patch.name)?;

    let emoji = find_in_space(&space, emoji_id).await?;
    let emoji = emoji.rename(&patch.name, db()).await?;
    emit_event(
        "emojis.onUpdate",
        &emoji,
        &format!("space:{}", space.base.id),
    )
    .await?;
    Ok(emoji.into())
}

async fn delete(
    Path((_, emoji_id)): Path<(Uuid, Uuid)>,
    Load(space): Load<SpaceExt>,
    Load(member): Load<MemberExt>,
) -> Result<Json<()>, Error> {
    permissions_or_admin(&space, &member, Permission::MANAGE_EMOJIS)?;

    let emoji = find_in_space(&space, emoji_id).await?;
    // Reactions with this emoji go with it (ON DELETE CASCADE).
    emoji.delete(db()).await?;
    emit_event(
        "emojis.onDelete",
        &emoji,
        &format!("space:{}", space.base.id),
    )
    .await?;
    Ok(().into())
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
                o.tag(TAG).id("emojis.update").summary("Rename Emoji")
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
