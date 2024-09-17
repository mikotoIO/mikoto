use aide::axum::routing::{get_with, post_with};
use axum::{extract::Path, Json};

use uuid::Uuid;

use crate::{
    entities::{Relationship, User},
    error::Error,
    routes::{router::AppRouter, ws::state::State},
};

async fn get(_id: Path<Uuid>) -> Result<Json<Relationship>, Error> {
    Err(Error::Todo)
}

async fn list() -> Result<Json<Vec<Relationship>>, Error> {
    Ok(vec![].into()) // TODO
}

async fn open_dm(_id: Path<Uuid>) -> Result<Json<User>, Error> {
    Err(Error::Todo)
}

static TAG: &str = "Relations";

pub fn router() -> AppRouter<State> {
    AppRouter::new()
        .route(
            "/",
            get_with(list, |o| {
                o.tag(TAG)
                    .id("relations.list")
                    .summary("List Relationships")
            }),
        )
        .route(
            "/:relationId",
            get_with(get, |o| {
                o.tag(TAG).id("relations.get").summary("Get Relationship")
            }),
        )
        .route(
            "/:relationId/dm",
            post_with(open_dm, |o| {
                o.tag(TAG)
                    .id("relations.openDm")
                    .summary("Open Direct Messages")
            }),
        )
}
