use fred::prelude::PubsubInterface;
use serde::Serialize;
use serde_json::json;

use crate::{db::redis, error::Result};

pub async fn emit_event<T: Serialize>(op: &str, data: T, channel: &str) -> Result<()> {
    let o = json!({
        "op": op,
        "data": data,
    })
    .to_string();

    redis().publish(channel, o).await?;
    Ok(())
}
