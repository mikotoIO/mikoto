use pwhash::bcrypt;
use rocket::serde::json::Json;
use serde::Serialize;

use crate::{
    context::Ctx,
    models::{Error, LoginRequest, TokenPair},
    prisma::{email_password, user},
};

#[derive(Serialize)]
pub struct AppInfo {
    name: String,
    version: String,
}

#[get("/")]
pub fn index() -> Json<AppInfo> {
    Json(AppInfo {
        name: "authstar".to_string(),
        version: "0.0.0".to_string(),
    })
}

#[post("/login", format = "json", data = "<body>")]
pub async fn login(ctx: &Ctx, body: Json<LoginRequest>) -> Result<(), Error> {
    let email_pw = ctx
        .prisma
        .email_password()
        .find_unique(email_password::email::equals(body.email.clone()))
        .with(email_password::user::fetch())
        .exec()
        .await
        .map_err(|_| Error::DatabaseError)?
        .ok_or(Error::NotFound)?;

    let cw = email_pw.user.unwrap();

    // let u = user::include!({ email_password });

    if bcrypt::verify(&body.password, &email_pw.password) {
        return Err(Error::AuthenticationFailed);
    }

    Ok(())
}
