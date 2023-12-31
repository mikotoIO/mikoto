// define the error types

use std::io::Cursor;

use rocket::http::{ContentType, Status};
use rocket::request::Request;
use rocket::response::{self, Responder, Response};
use s3::error::S3Error;

#[derive(Serialize, Debug)]
#[serde(tag = "code")]
pub enum Error {
    StorageError { internal: String },
    BadRequest,
    NotFound,
    InternalServerError,
    ImageError { internal: String },
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

impl From<S3Error> for Error {
    fn from(err: S3Error) -> Self {
        Error::StorageError {
            internal: err.to_string(),
        }
    }
}

impl From<image::ImageError> for Error {
    fn from(err: image::ImageError) -> Self {
        err.to_string();
        Error::ImageError {
            internal: err.to_string(),
        }
    }
}
