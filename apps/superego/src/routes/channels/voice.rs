use aide::axum::routing::post_with;
use axum::{extract::Path, Json};
use livekit_api::access_token::{AccessToken, VideoGrants};
use uuid::Uuid;

use crate::{
    db::db,
    entities::User,
    env::env,
    error::Error,
    functions::jwt::Claims,
    model,
    routes::{router::AppRouter, ws::state::State},
};

model!(
    pub struct VoiceToken {
        pub url: &'static str,
        pub token: String,
        pub channel_id: Uuid,
    }
);

async fn join(
    Path((_space_id, channel_id)): Path<(Uuid, Uuid)>,
    claim: Claims,
) -> Result<Json<VoiceToken>, Error> {
    let (url, key, secret) = if let (Some(url), Some(key), Some(secret)) = (
        env().livekit_server.as_ref(),
        env().livekit_key.as_ref(),
        env().livekit_secret.as_ref(),
    ) {
        (url, key, secret)
    } else {
        return Err(Error::InternalServerError {
            message: "LiveKit server not configured".to_string(),
        });
    };

    let user = User::find_by_id(Uuid::parse_str(&claim.sub)?, db()).await?;

    let token = AccessToken::with_api_key(&key, &secret)
        .with_identity(&user.id.to_string())
        .with_name(&user.name)
        .with_grants(VideoGrants {
            room_join: true,
            room: channel_id.to_string(),
            ..Default::default()
        })
        .to_jwt()
        .map_err(|_| Error::InternalServerError {
            message: "Failed to connect to LiveKit server".to_string(),
        })?;

    Ok(VoiceToken {
        url,
        token,
        channel_id,
    }
    .into())
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
