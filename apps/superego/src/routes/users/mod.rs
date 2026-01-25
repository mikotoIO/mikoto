use aide::axum::routing::{delete_with, get_with, patch_with, post_with};
use axum::Json;
use schemars::JsonSchema;

use crate::{
    db::db,
    entities::{Handle, ObjectWithId, User, UserExt, UserPatch},
    error::Error,
    functions::{jwt::Claims, pubsub::emit_event},
};

use super::{router::AppRouter, ws::state::State};

pub mod relations;

async fn me(claim: Claims) -> Result<Json<UserExt>, Error> {
    let user = User::find_by_id(claim.sub.parse()?, db()).await?;
    let user = UserExt::from_user(user, db()).await?;
    Ok(user.into())
}

async fn update(claim: Claims, Json(patch): Json<UserPatch>) -> Result<Json<UserExt>, Error> {
    let user = User::find_by_id(claim.sub.parse()?, db()).await?;
    let user = user.update(patch, db()).await?;
    let user_ext = UserExt::from_user(user.clone(), db()).await?;
    emit_event("users.onUpdate", &user_ext, &format!("user:{}", claim.sub)).await?;
    Ok(user_ext.into())
}

#[derive(Deserialize, JsonSchema)]
#[serde(rename_all = "camelCase")]
pub struct HandlePayload {
    pub handle: String,
}

async fn set_handle(claim: Claims, Json(body): Json<HandlePayload>) -> Result<Json<UserExt>, Error> {
    let user_id = claim.sub.parse()?;
    Handle::change_user_handle(user_id, body.handle, db()).await?;

    let user = User::find_by_id(user_id, db()).await?;
    let user_ext = UserExt::from_user(user, db()).await?;
    emit_event("users.onUpdate", &user_ext, &format!("user:{}", claim.sub)).await?;
    Ok(user_ext.into())
}

async fn delete_handle(claim: Claims) -> Result<Json<UserExt>, Error> {
    let user_id = claim.sub.parse()?;
    Handle::release_for_user(user_id, db()).await?;

    let user = User::find_by_id(user_id, db()).await?;
    let user_ext = UserExt::from_user(user, db()).await?;
    emit_event("users.onUpdate", &user_ext, &format!("user:{}", claim.sub)).await?;
    Ok(user_ext.into())
}

static TAG: &str = "Users";

pub fn router() -> AppRouter<State> {
    AppRouter::new()
        .route(
            "/me",
            get_with(me, |o| {
                o.tag(TAG).id("user.get").summary("Get Current User")
            }),
        )
        .route(
            "/me",
            patch_with(update, |o| {
                o.tag(TAG).id("user.update").summary("Update User")
            }),
        )
        .route(
            "/me/handle",
            post_with(set_handle, |o| {
                o.tag(TAG)
                    .id("user.setHandle")
                    .summary("Set or Change User Handle")
            }),
        )
        .route(
            "/me/handle",
            delete_with(delete_handle, |o| {
                o.tag(TAG)
                    .id("user.deleteHandle")
                    .summary("Release User Handle")
            }),
        )
        .on_ws(|router| {
            router
                .event("onCreate", |user: UserExt, _| async move { Some(user) })
                .event("onUpdate", |user: UserExt, _| async move { Some(user) })
                .event(
                    "onDelete",
                    |user: ObjectWithId, _| async move { Some(user) },
                )
        })
}
