use aide::axum::routing::post_with;
use axum::{extract::Path, Json};
use uuid::Uuid;

use crate::{
    error::Error,
    model,
    routes::{router::AppRouter, ws::state::State},
};

model!(
    pub struct VoiceToken {
        pub url: String,
        pub token: String,
        pub channel_id: Uuid,
    }
);

async fn join(_channel_id: Path<Uuid>) -> Result<Json<VoiceToken>, Error> {
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
