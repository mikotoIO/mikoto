use std::io::Cursor;

use rocket::{http::ContentType, response::Responder, Response};
use serde::{Deserialize, Serialize};
use serde_json::to_string;

#[derive(Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum Error {
    NotFound,
    AuthenticationFailed,
    DatabaseError,
}

#[derive(Serialize, Deserialize)]
pub struct LoginRequest {
    pub email: String,
    pub password: String,
}

#[derive(Serialize, Deserialize)]
pub struct TokenPair {
    pub access_token: String, // JWT
    pub refresh_token: String,
}

impl<'r> Responder<'r, 'static> for Error {
    fn respond_to(self, _: &'r rocket::Request<'_>) -> rocket::response::Result<'static> {
        let status = match self {
            Error::NotFound => rocket::http::Status::NotFound,
            Error::AuthenticationFailed => rocket::http::Status::Unauthorized,
            _ => rocket::http::Status::InternalServerError,
        };

        let body = to_string(&self).unwrap();

        Response::build()
            .sized_body(body.len(), Cursor::new(body))
            .status(status)
            .header(ContentType::new("application", "json"));
        todo!("lmao")
    }
}
