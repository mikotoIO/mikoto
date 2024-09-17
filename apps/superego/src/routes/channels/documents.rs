use aide::axum::routing::{get_with, patch_with};
use axum::{extract::Path, Json};
use uuid::Uuid;

use crate::{
    db::db,
    entities::{Document, DocumentPatch},
    error::Error,
    routes::{router::AppRouter, ws::state::State},
};

async fn get(Path((_, channel_id)): Path<(Uuid, Uuid)>) -> Result<Json<Document>, Error> {
    let document = Document::get_by_channel_id(channel_id, db()).await?;
    Ok(document.into())
}

async fn update(
    Path((_, channel_id)): Path<(Uuid, Uuid)>,
    Json(patch): Json<DocumentPatch>,
) -> Result<Json<Document>, Error> {
    let document = Document::get_by_channel_id(channel_id, db()).await?;
    let document = document.update(patch, db()).await?;
    Ok(document.into())
}

static TAG: &str = "Documents";

pub fn router() -> AppRouter<State> {
    AppRouter::new()
        .route(
            "/",
            get_with(get, |o| {
                o.tag(TAG).id("documents.get").summary("Get Document")
            }),
        )
        .route(
            "/",
            patch_with(update, |o| {
                o.tag(TAG).id("documents.update").summary("Update Document")
            }),
        )
}
