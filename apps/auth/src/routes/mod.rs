use serde::{Deserialize, Serialize};

use rocket::serde::json::Json;

use crate::{
    context::Ctx,
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
        name: "mAuth".to_string(),
        version: "0.0.0".to_string(),
    })
}

#[derive(Deserialize)]
pub struct LoginRequest {
    email: String,
    password: String,
}

#[post("/login", format = "json", data = "<data>")]
pub async fn login(ctx: &Ctx, data: Json<LoginRequest>) {
    let data = ctx
        .prisma
        .email_password()
        .find_unique(email_password::email::equals(data.email.clone()))
        .with(email_password::user::fetch())
        .exec()
        .await
        .unwrap()
        .unwrap();

    let u = user::include!({ email_password });
}
