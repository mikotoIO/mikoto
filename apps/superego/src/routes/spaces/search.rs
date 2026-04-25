use aide::axum::routing::get_with;
use axum::{extract::Query, Json};
use schemars::JsonSchema;
use uuid::Uuid;

use crate::{
    db::db,
    entities::{
        Document, DocumentSearchResult, MemberExt, Message, MessageSearchResult, SpaceExt,
    },
    error::Error,
    functions::jwt::Claims,
    middlewares::load::Load,
    routes::{router::AppRouter, ws::state::State},
};

#[derive(Deserialize, JsonSchema)]
#[serde(rename_all = "camelCase")]
struct MessageSearchQuery {
    q: String,
    channel_id: Option<Uuid>,
    author_id: Option<Uuid>,
    limit: Option<i32>,
    offset: Option<i32>,
}

#[derive(Deserialize, JsonSchema)]
#[serde(rename_all = "camelCase")]
struct DocumentSearchQuery {
    q: String,
    channel_id: Option<Uuid>,
    limit: Option<i32>,
    offset: Option<i32>,
}

async fn search_messages(
    _claim: Claims,
    _member: Load<MemberExt>,
    Load(space): Load<SpaceExt>,
    Query(query): Query<MessageSearchQuery>,
) -> Result<Json<Vec<MessageSearchResult>>, Error> {
    if query.q.trim().is_empty() {
        return Ok(Vec::new().into());
    }
    let limit = query.limit.unwrap_or(25).clamp(1, 50);
    let offset = query.offset.unwrap_or(0).max(0);
    let hits = Message::search_in_space(
        space.base.id,
        &query.q,
        query.channel_id,
        query.author_id,
        limit,
        offset,
        db(),
    )
    .await?;
    let results = MessageSearchResult::dataload(hits, db()).await?;
    Ok(results.into())
}

async fn search_documents(
    _claim: Claims,
    _member: Load<MemberExt>,
    Load(space): Load<SpaceExt>,
    Query(query): Query<DocumentSearchQuery>,
) -> Result<Json<Vec<DocumentSearchResult>>, Error> {
    if query.q.trim().is_empty() {
        return Ok(Vec::new().into());
    }
    let limit = query.limit.unwrap_or(25).clamp(1, 50);
    let offset = query.offset.unwrap_or(0).max(0);
    let hits = Document::search_in_space(
        space.base.id,
        &query.q,
        query.channel_id,
        limit,
        offset,
        db(),
    )
    .await?;
    let results: Vec<DocumentSearchResult> = hits.into_iter().map(Into::into).collect();
    Ok(results.into())
}

static TAG: &str = "Search";

pub fn router() -> AppRouter<State> {
    AppRouter::new()
        .route(
            "/messages",
            get_with(search_messages, |o| {
                o.tag(TAG)
                    .id("search.messages")
                    .summary("Search Messages")
            }),
        )
        .route(
            "/documents",
            get_with(search_documents, |o| {
                o.tag(TAG)
                    .id("search.documents")
                    .summary("Search Documents")
            }),
        )
}
