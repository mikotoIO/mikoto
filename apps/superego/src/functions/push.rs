use serde::Serialize;
use uuid::Uuid;
use web_push::{
    ContentEncoding, HyperWebPushClient, SubscriptionInfo, SubscriptionKeys, URL_SAFE_NO_PAD,
    VapidSignatureBuilder, WebPushClient, WebPushError, WebPushMessageBuilder,
};

use crate::{db::db, entities::PushSubscription, env::env};

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

    for sub in subs {
        let info = SubscriptionInfo {
            endpoint: sub.endpoint.clone(),
            keys: SubscriptionKeys {
                p256dh: sub.p256dh.clone(),
                auth: sub.auth.clone(),
            },
        };

        let sig = match VapidSignatureBuilder::from_base64(
            &vapid.private_key,
            URL_SAFE_NO_PAD,
            &info,
        ) {
            Ok(mut b) => {
                b.add_claim("sub", vapid.subject.as_str());
                match b.build() {
                    Ok(s) => s,
                    Err(e) => {
                        log::error!("vapid signing failed: {e}");
                        continue;
                    }
                }
            }
            Err(e) => {
                log::error!("vapid builder failed: {e}");
                continue;
            }
        };

        let mut builder = WebPushMessageBuilder::new(&info);
        builder.set_payload(ContentEncoding::Aes128Gcm, &payload_bytes);
        builder.set_vapid_signature(sig);

        let message = match builder.build() {
            Ok(m) => m,
            Err(e) => {
                log::error!("push message build failed: {e}");
                continue;
            }
        };

        let client = HyperWebPushClient::new();
        match client.send(message).await {
            Ok(_) => {}
            Err(WebPushError::EndpointNotValid) | Err(WebPushError::EndpointNotFound) => {
                // 404/410 — the browser has revoked this subscription.
                let _ = PushSubscription::delete_by_id(sub.id, db()).await;
            }
            Err(e) => {
                log::warn!("push send failed for {}: {e}", sub.endpoint);
            }
        }
    }
}
