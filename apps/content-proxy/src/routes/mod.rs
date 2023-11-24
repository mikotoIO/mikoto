use rocket::serde::json::Json;

pub mod serve;
pub mod upload;

#[derive(Serialize)]
pub struct Hello {
    pub name: String,
}

impl Default for Hello {
    fn default() -> Self {
        Self {
            name: "contentproxy".to_string(),
        }
    }
}

#[get("/")]
pub fn hello() -> Json<Hello> {
    Json(Hello::default())
}
