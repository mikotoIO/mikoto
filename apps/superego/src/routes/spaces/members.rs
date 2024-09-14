use aide::axum::routing::{delete_with, get_with, patch_with, post_with};
use axum::{extract::Path, Json};
use schemars::JsonSchema;
use uuid::Uuid;

use crate::{
    entities::{Member, ObjectWithId},
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

async fn get(_id: Path<Uuid>) -> Result<Json<Member>, Error> {
    Err(Error::Todo)
}

async fn list() -> Result<Json<Vec<Member>>, Error> {
    Err(Error::Todo)
}

async fn create(_body: Json<MemberCreatePayload>) -> Result<Json<Member>, Error> {
    Err(Error::Todo)
}

async fn update(_id: Path<Uuid>, _body: Json<MemberUpdatePayload>) -> Result<Json<Member>, Error> {
    Err(Error::Todo)
}

async fn delete(_id: Path<Uuid>) -> Result<Json<()>, Error> {
    Err(Error::Todo)
}

static TAG: &str = "Members";

pub fn router() -> AppRouter<State> {
    AppRouter::new()
        .on_http(|router| {
            router
                .api_route(
                    "/",
                    get_with(list, |o| {
                        o.tag(TAG)
                            .id("members.list")
                            .summary("List Members in Space")
                    }),
                )
                .api_route(
                    "/:id",
                    get_with(get, |o| {
                        o.tag(TAG)
                            .id("members.get")
                            .summary("Get Member from Space")
                    }),
                )
                .api_route(
                    "/",
                    post_with(create, |o| {
                        o.tag(TAG).id("members.create").summary("Add Bot Member")
                    }),
                )
                .api_route(
                    "/:id",
                    patch_with(update, |o| {
                        o.tag(TAG).id("members.update").summary("Update Member")
                    }),
                )
                .api_route(
                    "/:id",
                    delete_with(delete, |o| {
                        o.tag(TAG).id("members.delete").summary("Ban Member")
                    }),
                )
        })
        .on_ws(|router| {
            router
                .event("onCreate", |member: Member, _| Some(member))
                .event("onUpdate", |member: Member, _| Some(member))
                .event("onDelete", |member: ObjectWithId, _| Some(member))
        })
}
