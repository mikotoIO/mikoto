// define the error types

use std::io::Cursor;

use rocket::http::{ContentType, Status};
use rocket::request::Request;
use rocket::response::{self, Responder, Response};

#[derive(Serialize, Debug)]
#[serde(tag = "type")]
pub enum Error {
    StorageError,
    NotFound,
    InternalServerError,
}

// implement Responder for Error
impl<'r> Responder<'r, 'r> for Error {
    fn respond_to(self, _: &Request) -> response::Result<'r> {
        let status = match self {
            Error::NotFound => Status::NotFound,
            _ => Status::InternalServerError,
        };

        let string = json!(self).to_string();
        Response::build()
            .header(ContentType::new("application", "json"))
            .sized_body(string.len(), Cursor::new(string))
            .status(status)
            .ok()
    }
}
