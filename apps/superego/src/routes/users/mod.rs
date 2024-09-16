use aide::axum::routing::{get_with, patch_with};
use axum::Json;

use crate::{
    db::db,
    entities::{ObjectWithId, User, UserPatch},
    error::Error,
    functions::{jwt::Claims, pubsub::emit_event},
};

use super::{router::AppRouter, ws::state::State};

pub mod relations;

async fn me(claim: Claims) -> Result<Json<User>, Error> {
    let user = User::find_by_id(claim.sub.parse()?, db()).await?;
    Ok(user.into())
}

async fn update(claim: Claims, Json(patch): Json<UserPatch>) -> Result<Json<User>, Error> {
    let user = User::find_by_id(claim.sub.parse()?, db()).await?;
    let user = user.update(patch, db()).await?;
    emit_event("users.onUpdate", &user, &format!("user:{}", claim.sub)).await?;
    Ok(user.into())
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
        .on_ws(|router| {
            router
                .event("onCreate", |user: User, _| async move { Some(user) })
                .event("onUpdate", |user: User, _| async move { Some(user) })
                .event(
                    "onDelete",
                    |user: ObjectWithId, _| async move { Some(user) },
                )
        })
}
