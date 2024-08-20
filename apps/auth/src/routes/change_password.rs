use axum::Json;
use schemars::JsonSchema;
use uuid::Uuid;

use crate::{
    db::db,
    entities::{Account, RefreshToken, TokenPair},
    error::Error,
    functions::jwt::UserClaims,
};

#[derive(Deserialize, JsonSchema)]
#[serde(rename_all = "camelCase")]
pub struct ChangePasswordPayload {
    pub id: Uuid,
    pub old_password: String,
    pub new_password: String,
}

pub async fn route(body: Json<ChangePasswordPayload>) -> Result<Json<TokenPair>, Error> {
    let acc = Account::find_by_id(&body.id, db()).await?;

    if !bcrypt::verify(&body.old_password, &acc.passhash)? {
        return Err(Error::WrongPassword);
    }

    RefreshToken::clear_all(body.id, db()).await?;

    let new_passhash = bcrypt::hash(&body.new_password, bcrypt::DEFAULT_COST)?;
    sqlx::query(
        r##"
        UPDATE "Account" SET "passhash" = $1 WHERE "id" = $2
        "##,
    )
    .bind(&new_passhash)
    .bind(&body.id)
    .execute(db())
    .await?;

    let (refresh, token) = RefreshToken::new(acc.id);
    refresh.create(db()).await?;

    Ok(Json(TokenPair {
        access_token: UserClaims::from(acc).encode()?,
        refresh_token: token,
    }))
}
