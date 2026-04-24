use base64ct::{Base64UrlUnpadded, Encoding};
use reqwest::StatusCode;
use serde::Serialize;
use uuid::Uuid;
use web_push_native::{
    jwt_simple::algorithms::ES256KeyPair, p256::PublicKey, Auth, WebPushBuilder,
};

use crate::{
    db::db,
    entities::{MessageExt, PushSubscription},
    env::env,
};

/// Payload delivered to the service worker. Keep this small —
/// the Web Push protocol caps encrypted payloads at ~4KB.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PushPayload {
    pub title: String,
    pub body: String,
    /// Deep link opened when the notification is clicked.
    pub url: String,
    /// Icon URL (e.g. avatar). Optional; SW falls back to app icon.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub icon: Option<String>,
    /// Collapse key so a second push for the same conversation
    /// replaces the first instead of stacking.
    pub tag: String,
}

impl From<MessageExt> for PushPayload {
    fn from(message: MessageExt) -> Self {
        let channel_id = message.base.channel_id;

        Self {
            title: message
                .author
                .as_ref()
                .map(|a| a.name.clone())
                .unwrap_or_else(|| "New message".to_string()),
            body: truncate(&message.base.content, 140),
            url: format!("/dm/{channel_id}"),
            icon: message.author.as_ref().and_then(|a| a.avatar.clone()),
            tag: format!("dm:{channel_id}"),
        }
    }
}

fn truncate(s: &str, max_chars: usize) -> String {
    if s.chars().count() <= max_chars {
        return s.to_string();
    }
    let mut out: String = s.chars().take(max_chars).collect();
    out.push('…');
    out
}

pub fn is_enabled() -> bool {
    env().vapid.is_some()
}

pub fn public_key() -> Option<&'static str> {
    env().vapid.as_ref().map(|v| v.public_key.as_str())
}

/// Send a push payload to every registered endpoint for a user.
/// Errors are logged, never bubbled — push is best-effort.
pub async fn send_to_user(user_id: Uuid, payload: &PushPayload) {
    let Some(vapid) = env().vapid.as_ref() else {
        return;
    };

    let key_pair = match Base64UrlUnpadded::decode_vec(&vapid.private_key)
        .map_err(|e| e.to_string())
        .and_then(|bytes| ES256KeyPair::from_bytes(&bytes).map_err(|e| e.to_string()))
    {
        Ok(kp) => kp,
        Err(e) => {
            log::error!("failed to load VAPID key pair: {e}");
            return;
        }
    };

    let subs = match PushSubscription::list_by_user(user_id, db()).await {
        Ok(s) => s,
        Err(e) => {
            log::error!("failed to list push subscriptions for {user_id}: {e}");
            return;
        }
    };

    let payload_bytes = match serde_json::to_vec(payload) {
        Ok(b) => b,
        Err(e) => {
            log::error!("failed to serialize push payload: {e}");
            return;
        }
    };

    let client = reqwest::Client::new();

    for sub in subs {
        let ua_public = match Base64UrlUnpadded::decode_vec(&sub.p256dh)
            .map_err(|e| e.to_string())
            .and_then(|bytes| PublicKey::from_sec1_bytes(&bytes).map_err(|e| e.to_string()))
        {
            Ok(k) => k,
            Err(e) => {
                log::error!("invalid p256dh key for subscription {}: {e}", sub.id);
                continue;
            }
        };

        let ua_auth = match Base64UrlUnpadded::decode_vec(&sub.auth) {
            Ok(bytes) if bytes.len() == 16 => Auth::clone_from_slice(&bytes),
            Ok(bytes) => {
                log::error!(
                    "invalid auth length for subscription {}: expected 16, got {}",
                    sub.id,
                    bytes.len()
                );
                continue;
            }
            Err(e) => {
                log::error!("invalid auth base64 for subscription {}: {e}", sub.id);
                continue;
            }
        };

        let endpoint = match sub.endpoint.parse() {
            Ok(uri) => uri,
            Err(e) => {
                log::error!("invalid endpoint URI for subscription {}: {e}", sub.id);
                continue;
            }
        };

        let builder =
            WebPushBuilder::new(endpoint, ua_public, ua_auth).with_vapid(&key_pair, &vapid.subject);

        let request = match builder.build(payload_bytes.clone()) {
            Ok(r) => r,
            Err(e) => {
                log::error!("push message build failed: {e}");
                continue;
            }
        };

        let (parts, body) = request.into_parts();
        let reqwest_req = match client
            .post(parts.uri.to_string())
            .headers(parts.headers)
            .body(body)
            .build()
        {
            Ok(r) => r,
            Err(e) => {
                log::error!("reqwest request build failed: {e}");
                continue;
            }
        };

        match client.execute(reqwest_req).await {
            Ok(resp) => {
                let status = resp.status();
                match status {
                    s if s.is_success() => {}
                    StatusCode::GONE | StatusCode::NOT_FOUND => {
                        // The browser has revoked this subscription.
                        let _ = PushSubscription::delete_by_id(sub.id, db()).await;
                    }
                    s => {
                        let body = resp.text().await.unwrap_or_default();
                        log::warn!("push send failed for {} (HTTP {s}): {body}", sub.endpoint);
                    }
                }
            }
            Err(e) => {
                log::warn!("push send failed for {}: {e}", sub.endpoint);
            }
        }
    }
}
