use axum::Json;
use schemars::JsonSchema;

use crate::{
    db::db,
    entities::{Account, RefreshToken, TokenPair},
    error::Error,
    functions::jwt::Claims,
};

#[derive(Deserialize, JsonSchema)]
#[serde(rename_all = "camelCase")]
pub struct RefreshPayload {
    pub refresh_token: String,
}

pub async fn route(body: Json<RefreshPayload>) -> Result<Json<TokenPair>, Error> {
    let refresh = RefreshToken::find_token(&body.refresh_token, db()).await?;

    if refresh.expires_at < time::OffsetDateTime::now_utc() {
        return Err(Error::TokenExpired);
    }

    let acc = Account::find_by_id(&refresh.account_id, db()).await?;

    Ok(Json(TokenPair {
        access_token: Claims::from(acc).encode()?,
        refresh_token: body.refresh_token.clone(),
    }))
}
