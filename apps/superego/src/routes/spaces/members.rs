use aide::axum::routing::{delete_with, get_with, patch_with, post_with};
use axum::{extract::Path, Json};
use schemars::JsonSchema;
use uuid::Uuid;

use crate::{
    entities::{MemberExt, MemberKey},
    error::Error,
    routes::{router::AppRouter, ws::state::State},
};

#[derive(Deserialize, JsonSchema)]
#[serde(rename_all = "camelCase")]
pub struct MemberCreatePayload {
    pub user_id: Uuid,
}

#[derive(Deserialize, JsonSchema)]
#[serde(rename_all = "camelCase")]
pub struct MemberUpdatePayload {
    pub role_ids: Vec<Uuid>,
}

async fn get(_id: Path<Uuid>) -> Result<Json<MemberExt>, Error> {
    Err(Error::Todo)
}

async fn list() -> Result<Json<Vec<MemberExt>>, Error> {
    Err(Error::Todo)
}

async fn create(_body: Json<MemberCreatePayload>) -> Result<Json<MemberExt>, Error> {
    Err(Error::Todo)
}

async fn update(
    _id: Path<Uuid>,
    _body: Json<MemberUpdatePayload>,
) -> Result<Json<MemberExt>, Error> {
    Err(Error::Todo)
}

async fn delete(_id: Path<Uuid>) -> Result<Json<()>, Error> {
    Err(Error::Todo)
}

static TAG: &str = "Members";

pub fn router() -> AppRouter<State> {
    AppRouter::new()
        .route(
            "/",
            get_with(list, |o| {
                o.tag(TAG)
                    .id("members.list")
                    .summary("List Members in Space")
            }),
        )
        .route(
            "/:id",
            get_with(get, |o| {
                o.tag(TAG)
                    .id("members.get")
                    .summary("Get Member from Space")
            }),
        )
        .route(
            "/",
            post_with(create, |o| {
                o.tag(TAG).id("members.create").summary("Add Bot Member")
            }),
        )
        .route(
            "/:id",
            patch_with(update, |o| {
                o.tag(TAG).id("members.update").summary("Update Member")
            }),
        )
        .route(
            "/:id",
            delete_with(delete, |o| {
                o.tag(TAG).id("members.delete").summary("Ban Member")
            }),
        )
        .ws_event(
            "onCreate",
            |member: MemberExt, _| async move { Some(member) },
        )
        .ws_event(
            "onUpdate",
            |member: MemberExt, _| async move { Some(member) },
        )
        .ws_event(
            "onDelete",
            |member: MemberKey, _| async move { Some(member) },
        )
}
