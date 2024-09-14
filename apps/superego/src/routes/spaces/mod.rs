use aide::axum::routing::{delete_with, get_with, patch_with, post_with};
use axum::{extract::Path, Json};
use schemars::JsonSchema;
use uuid::Uuid;

use crate::{
    entities::{ObjectWithId, SpaceExt},
    error::Error,
};

use super::{router::AppRouter, ws::state::State};

pub mod members;
pub mod roles;

#[derive(Deserialize, JsonSchema)]
#[serde(rename_all = "camelCase")]
pub struct SpaceCreatePayload {
    pub name: String,
}

#[derive(Deserialize, JsonSchema)]
#[serde(rename_all = "camelCase")]
pub struct SpaceUpdatePayload {
    pub name: String,
}

async fn get(_id: Path<Uuid>) -> Result<Json<SpaceExt>, Error> {
    Err(Error::Todo)
}

async fn list() -> Result<Json<Vec<SpaceExt>>, Error> {
    Err(Error::Todo)
}

async fn create(_body: Json<SpaceCreatePayload>) -> Result<Json<SpaceExt>, Error> {
    Err(Error::Todo)
}

async fn update(_id: Path<Uuid>, _body: Json<SpaceUpdatePayload>) -> Result<Json<SpaceExt>, Error> {
    Err(Error::Todo)
}

async fn delete(_id: Path<Uuid>) -> Result<Json<()>, Error> {
    Err(Error::Todo)
}

static TAG: &str = "Spaces";

pub fn router() -> AppRouter<State> {
    AppRouter::new()
        .route(
            "/",
            get_with(list, |o| {
                o.tag(TAG).id("spaces.list").summary("List Spaces")
            }),
        )
        .route(
            "/:id",
            get_with(get, |o| o.tag(TAG).id("spaces.get").summary("Get Space")),
        )
        .route(
            "/",
            post_with(create, |o| {
                o.tag(TAG).id("spaces.create").summary("Create Space")
            }),
        )
        .route(
            "/:id",
            patch_with(update, |o| {
                o.tag(TAG).id("spaces.update").summary("Update Space")
            }),
        )
        .route(
            "/:id",
            delete_with(delete, |o| {
                o.tag(TAG).id("spaces.delete").summary("Delete Space")
            }),
        )
        .on_ws(|router| {
            router
                .event("onCreate", |space: SpaceExt, _| Some(space))
                .event("onUpdate", |space: SpaceExt, _| Some(space))
                .event("onDelete", |space: ObjectWithId, _| Some(space))
        })
}
