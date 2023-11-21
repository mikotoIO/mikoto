use rocket::serde::json::Json;

pub mod serve;
pub mod upload;

#[derive(Serialize)]
pub struct Hello {}

impl Default for Hello {
    fn default() -> Self {
        Self {}
    }
}

#[get("/")]
pub fn hello() -> Json<Hello> {
    Json(Hello::default())
}