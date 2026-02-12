use aide::axum::routing::get_with;
use axum::{extract::Path, Json};

use crate::{db::db, entities::{Handle, HandleResolution}, error::Error};

use super::{router::AppRouter, ws::state::State};

async fn resolve(Path(handle): Path<String>) -> Result<Json<HandleResolution>, Error> {
    let handle_entity = Handle::resolve(&handle, db())
        .await?
        .ok_or(Error::NotFound)?;

    let resolution = handle_entity
        .to_resolution()
        .ok_or_else(|| Error::internal("Invalid handle state"))?;

    Ok(resolution.into())
}

static TAG: &str = "Handles";

pub fn router() -> AppRouter<State> {
    AppRouter::new().route(
        "/:handle",
        get_with(resolve, |o| {
            o.tag(TAG)
                .id("handles.resolve")
                .summary("Resolve a Handle")
        }),
    )
}
