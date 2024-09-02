use axum::Json;
use schemars::JsonSchema;

use crate::{
    db::db,
    entities::{Account, AccountVerification},
    env::env,
    error::Error,
    functions::{
        captcha::captcha,
        mail::{mailer, MailTemplate},
    },
};

#[derive(Deserialize, JsonSchema)]
#[serde(rename_all = "camelCase")]
pub struct ResetPasswordPayload {
    pub email: String,
    pub captcha: Option<String>,
}

static RESET_PASSWORD_TEMPLATE: MailTemplate = MailTemplate {
    subject: "Reset your password",
    body: include_str!("../../email/reset.hbs"),
};

#[derive(Serialize)]
pub struct ResetPasswordData {
    pub name: String,
    pub link: String,
}

pub async fn route(body: Json<ResetPasswordPayload>) -> Result<Json<()>, Error> {
    captcha().validate(body.captcha.as_deref()).await?;

    let account = Account::find_by_email(&body.email, db()).await?;
    let verification = AccountVerification::create_password_reset(account.id.clone(), db()).await?;

    mailer()
        .send(
            &RESET_PASSWORD_TEMPLATE,
            &body.email,
            ResetPasswordData {
                name: account.email.clone(),
                link: format!("{}/forgotpassword/{}", env().web_url, verification.token),
            },
        )
        .await?;
    Ok(Json(()))
}

#[derive(Deserialize, JsonSchema)]
#[serde(rename_all = "camelCase")]
pub struct ResetPasswordConfirmData {
    pub token: String,
    pub password: String,
}

pub async fn confirm(data: Json<ResetPasswordConfirmData>) -> Result<Json<()>, Error> {
    let verification =
        AccountVerification::find_by_token(&data.token, "PASSWORD_RESET", db()).await?;
    let account = Account::find_by_id(&verification.account_id, db()).await?;
    account.update_password(&data.password, db()).await?;
    Ok(Json(()))
}
