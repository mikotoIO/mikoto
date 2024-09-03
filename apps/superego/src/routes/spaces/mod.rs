use aide::axum::{
    routing::{delete_with, get_with, post_with, put_with},
    ApiRouter,
};
use axum::{extract::Path, Json};
use schemars::JsonSchema;
use uuid::Uuid;

use crate::{entities::SpaceResponse, error::Error};

#[derive(Deserialize, JsonSchema)]
pub struct SpaceCreatePayload {
    pub name: String,
}

#[derive(Deserialize, JsonSchema)]
pub struct SpaceUpdatePayload {
    pub name: String,
}

async fn get(_id: Path<Uuid>) -> Result<Json<SpaceResponse>, Error> {
    Err(Error::Todo)
}

async fn list() -> Result<Json<Vec<SpaceResponse>>, Error> {
    Err(Error::Todo)
}

async fn create(_body: Json<SpaceCreatePayload>) -> Result<Json<SpaceResponse>, Error> {
    Err(Error::Todo)
}

async fn update(
    _id: Path<Uuid>,
    _body: Json<SpaceUpdatePayload>,
) -> Result<Json<SpaceResponse>, Error> {
    Err(Error::Todo)
}

async fn delete(_id: Path<Uuid>) -> Result<Json<()>, Error> {
    Err(Error::Todo)
}

pub fn router() -> ApiRouter {
    ApiRouter::<()>::new()
        .api_route(
            "/",
            get_with(list, |o| o.tag("Spaces").summary("List Spaces")),
        )
        .api_route(
            "/:id",
            get_with(get, |o| o.tag("Spaces").summary("Get Space")),
        )
        .api_route(
            "/",
            post_with(create, |o| o.tag("Spaces").summary("Create Space")),
        )
        .api_route(
            "/:id",
            put_with(update, |o| o.tag("Spaces").summary("Update Space")),
        )
        .api_route(
            "/:id",
            delete_with(delete, |o| o.tag("Spaces").summary("Delete Space")),
        )
}
