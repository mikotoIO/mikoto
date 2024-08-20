use axum::Json;
use schemars::JsonSchema;

use crate::{db::db, entities::Account, error::Error, functions::captcha::captcha};

#[derive(Deserialize, JsonSchema)]
#[serde(rename_all = "camelCase")]
pub struct ResetPasswordPayload {
    pub email: String,
    pub captcha: Option<String>,
}

pub async fn route(body: Json<ResetPasswordPayload>) -> Result<Json<()>, Error> {
    captcha().validate(body.captcha.as_deref()).await?;

    let account = Account::find_by_email(&body.email, db()).await?;
    // let token = account.create_reset_token(db()).await?;

    // let url = format!(
    //     "{}/reset-password/{}",
    //     env().issuer.trim_end_matches('/'),
    //     token
    // );

    // // send email with url
    // println!("Reset password URL: {}", url);

    Ok(Json(()))
}
