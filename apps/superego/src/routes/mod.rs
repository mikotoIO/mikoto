use std::sync::{Arc, OnceLock};

use aide::{
    axum::{routing::get_with, IntoApiResponse},
    openapi::{Info, OpenApi},
};
use axum::{extract::Request, middleware, Extension, Json, Router};
use channels::voice;
use http::header::{AUTHORIZATION, CONTENT_TYPE};
use router::AppRouter;
use schemars::JsonSchema;
use serde::Serialize;
use tokio::sync::RwLock;
use tower_http::cors::CorsLayer;
use ws::state::State;

use crate::{
    db::db,
    entities::{self, Channel},
    env::{env, MikotoMode},
    functions::pubsub::emit_event,
};

pub mod account;
pub mod bots;
pub mod cdn;
pub mod channels;
pub mod collab;
pub mod dm;
pub mod handles;
pub mod router;
pub mod spaces;
pub mod users;
pub mod well_known;
pub mod ws;

#[derive(Debug, Serialize, JsonSchema)]
#[serde(rename_all = "camelCase")]
pub struct IndexResponse {
    name: String,
    version: String,
}

pub async fn serve_api(Extension(api): Extension<OpenApi>) -> impl IntoApiResponse {
    Json(api)
}

pub async fn index() -> Json<&'static IndexResponse> {
    static RESP: OnceLock<IndexResponse> = OnceLock::new();
    Json(RESP.get_or_init(|| IndexResponse {
        name: "superego".to_string(),
        version: "*".to_string(),
    }))
}

#[derive(Serialize, Deserialize, JsonSchema)]
pub struct Ping {
    pub message: String,
}

#[derive(Serialize, Deserialize, JsonSchema)]
#[serde(rename_all = "camelCase")]
pub struct TypingStart {
    pub channel_id: String,
}

#[derive(Serialize, Deserialize, JsonSchema)]
#[serde(rename_all = "camelCase")]
pub struct TypingUpdate {
    pub channel_id: String,
    pub user_id: String,
}

fn build_app_router() -> AppRouter<State> {
    AppRouter::<State>::new()
        .on_http(|router| {
            router
                .api_route("/", get_with(index, |o| o.id("index").summary("Index")))
                .nest("/account", account::router())
                .nest("/bots", bots::router())
                .nest("/cdn", cdn::router())
                .nest("/handles", handles::router().http)
                .nest("/.well-known", well_known::router())
        })
        .nest("users", "/users", users::router())
        .nest("relations", "/relations", users::relations::router())
        .nest("dm_messages", "/dm/:channelId/messages", dm::router())
        .nest("spaces", "/spaces", spaces::router())
        .nest("channels", "/spaces/:spaceId/channels", channels::router())
        .nest(
            "messages",
            "/spaces/:spaceId/channels/:channelId/messages",
            channels::messages::router(),
        )
        .nest(
            "voice",
            "/spaces/:spaceId/channels/:channelId/voice",
            voice::router(),
        )
        .nest(
            "documents",
            "/spaces/:spaceId/channels/:channelId/documents",
            channels::documents::router(),
        )
        .nest(
            "members",
            "/spaces/:spaceId/members",
            spaces::members::router(),
        )
        .nest("roles", "/spaces/:spaceId/roles", spaces::roles::router())
        .nest("bans", "/spaces/:spaceId/bans", spaces::bans::router())
        .nest(
            "roles",
            "/spaces/:spaceId/invites",
            spaces::invites::router(),
        )
        .ws_command("ping", |ping: Ping, state: Arc<RwLock<State>>| async move {
            let reader = state.read().await;
            emit_event("pong", ping, &format!("conn:{}", reader.conn_id)).await?;
            Ok(())
        })
        .ws_event("pong", |ping: Ping, _| async move { Some(ping) })
        .ws_command(
            "typing.start",
            |payload: TypingStart, state: Arc<RwLock<State>>| async move {
                let channel_id: uuid::Uuid = payload.channel_id.parse()?;
                let channel = Channel::find_by_id(channel_id, db()).await?;
                let user_id = state.read().await.user.id;
                let update = TypingUpdate {
                    channel_id: payload.channel_id,
                    user_id: user_id.to_string(),
                };
                if let Some(space_id) = channel.space_id {
                    emit_event("typing.onUpdate", &update, &format!("space:{space_id}")).await?;
                } else {
                    // DM channel — emit to both participants
                    emit_event("typing.onUpdate", &update, &format!("user:{user_id}")).await?;
                    if let Some(rel) =
                        entities::Relationship::find_by_channel(channel_id, user_id, db()).await?
                    {
                        emit_event(
                            "typing.onUpdate",
                            &update,
                            &format!("user:{}", rel.relation_id),
                        )
                        .await?;
                    }
                }
                Ok(())
            },
        )
        .ws_event("typing.onUpdate", |update: TypingUpdate, _| async move {
            Some(update)
        })
}

async fn security_headers(request: Request, next: middleware::Next) -> axum::response::Response {
    // Skip security headers for WebSocket upgrade requests — CSP and other
    // document-level headers are meaningless on 101 responses and can cause
    // Firefox to reject the connection.
    let is_websocket_upgrade = request
        .headers()
        .get(http::header::UPGRADE)
        .and_then(|v| v.to_str().ok())
        .is_some_and(|v| v.eq_ignore_ascii_case("websocket"));

    let mut response = next.run(request).await;

    if is_websocket_upgrade {
        return response;
    }

    let headers = response.headers_mut();
    headers.insert("X-Content-Type-Options", "nosniff".parse().unwrap());
    headers.insert("X-Frame-Options", "DENY".parse().unwrap());
    headers.insert(
        "Referrer-Policy",
        "strict-origin-when-cross-origin".parse().unwrap(),
    );
    headers.insert(
        "Permissions-Policy",
        "camera=(), microphone=(), geolocation=()".parse().unwrap(),
    );
    headers.insert(
        "Content-Security-Policy",
        "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https:; connect-src 'self' wss: ws: https:; frame-ancestors 'none'"
            .parse()
            .unwrap(),
    );
    if env().mikoto_env == MikotoMode::Production {
        headers.insert(
            "Strict-Transport-Security",
            "max-age=63072000; includeSubDomains".parse().unwrap(),
        );
    }
    response
}

pub fn router() -> Router {
    let router = build_app_router();

    router
        .build(OpenApi {
            info: Info {
                title: "Mikoto Superego".to_string(),
                ..Info::default()
            },
            ..OpenApi::default()
        })
        .merge(collab::router())
        .layer(middleware::from_fn(security_headers))
        .layer({
            let cors = CorsLayer::new()
                .allow_methods(tower_http::cors::Any)
                .allow_headers([AUTHORIZATION, CONTENT_TYPE]);

            if env().mikoto_env == MikotoMode::Production {
                let origin = env()
                    .web_url
                    .parse::<http::HeaderValue>()
                    .expect("WEB_URL must be a valid header value");
                cors.allow_origin(origin)
            } else {
                cors.allow_origin(tower_http::cors::Any)
            }
        })
}

pub fn build_openapi_schema() -> OpenApi {
    let router = build_app_router();

    let mut api = OpenApi {
        info: Info {
            title: "Mikoto Superego".to_string(),
            ..Info::default()
        },
        ..OpenApi::default()
    };

    // Add websocket extension to the OpenAPI schema
    api.extensions
        .insert("websocket".to_string(), router.ws.build_schema_ext());

    let _ = router.http.finish_api(&mut api);
    api
}
