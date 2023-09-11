use serde::{Deserialize, Serialize};

use rocket::serde::json::Json;

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
pub fn login(data: Json<LoginRequest>) {
    if (data.email == "thecactusblue@gmail.com") {}
    
}
