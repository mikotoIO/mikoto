use fred::prelude::PubsubInterface;
use serde::Serialize;
use serde_json::json;

use crate::{db::redis, error::Error};

pub async fn emit_event<T: Serialize>(op: &str, data: T, channel: &str) -> Result<(), Error> {
    let o = json!({
        "op": op,
        "data": data,
    })
    .to_string();

    let _: () = redis().publish(channel, o).await?;
    Ok(())
}
