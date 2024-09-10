use aide::axum::routing::{get_with, patch_with};
use axum::{extract::Path, Json};
use schemars::JsonSchema;
use uuid::Uuid;

use crate::{
    entities::{Channel, Document},
    error::Error,
    routes::{router::AppRouter, ws::state::State},
};

#[derive(Deserialize, JsonSchema)]
#[serde(rename_all = "camelCase")]
pub struct DocumentUpdatePayload {
    pub content: String,
}

async fn get(_id: Path<Uuid>) -> Result<Json<Document>, Error> {
    Err(Error::Todo)
}

async fn update(
    _id: Path<Uuid>,
    _body: Json<DocumentUpdatePayload>,
) -> Result<Json<Channel>, Error> {
    Err(Error::Todo)
}

static TAG: &str = "Documents";

pub fn router() -> AppRouter<State> {
    AppRouter::new().on_http(|router| {
        router
            .api_route("/", get_with(get, |o| o.tag(TAG).summary("Get Document")))
            .api_route(
                "/",
                patch_with(update, |o| o.tag(TAG).summary("Update Document")),
            )
    })
}
