use aide::axum::routing::{get_with, patch_with};
use axum::{extract::Path, Json};
use schemars::JsonSchema;
use uuid::Uuid;

use crate::{
    entities::{ObjectWithId, User},
    error::Error,
};

use super::{router::AppRouter, ws::state::State};

#[derive(Deserialize, JsonSchema)]
#[serde(rename_all = "camelCase")]
pub struct UserUpdatePayload {
    pub name: String,
}

async fn me(_id: Path<Uuid>) -> Result<Json<User>, Error> {
    Err(Error::Todo)
}

async fn update(_id: Path<Uuid>, _body: Json<UserUpdatePayload>) -> Result<Json<User>, Error> {
    Err(Error::Todo)
}

static TAG: &str = "Users";

pub fn router() -> AppRouter<State> {
    AppRouter::new()
        .on_http(|router| {
            router
                .api_route(
                    "/:id",
                    get_with(me, |o| {
                        o.tag(TAG).id("user.get").summary("Get Current User")
                    }),
                )
                .api_route(
                    "/:id",
                    patch_with(update, |o| {
                        o.tag(TAG).id("user.update").summary("Update User")
                    }),
                )
        })
        .on_ws(|router| {
            router
                .event("onCreate", |space: User, _| Some(space))
                .event("onUpdate", |space: User, _| Some(space))
                .event("onDelete", |space: ObjectWithId, _| Some(space))
        })
}
