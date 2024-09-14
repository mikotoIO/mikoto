use aide::axum::routing::post_with;
use axum::{extract::Path, Json};
use uuid::Uuid;

use crate::{
    entities::Document,
    error::Error,
    routes::{router::AppRouter, ws::state::State},
};

async fn join(_channel_id: Path<Uuid>) -> Result<Json<Document>, Error> {
    Err(Error::Todo)
}

static TAG: &str = "Voice";

pub fn router() -> AppRouter<State> {
    AppRouter::new().route(
        "/",
        post_with(join, |o| {
            o.tag(TAG).id("voice.join").summary("Join Voice Channel")
        }),
    )
}
