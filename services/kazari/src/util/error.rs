use rocket::{
    http::Status,
    response::{Responder, Response, Result},
    Request,
};
use serde::Serialize;

use rocket::serde::json::Json;

#[derive(Debug, Serialize, Clone)]
#[serde(tag = "type")]
pub enum Error {
    UrlParseError,
    ExtensionError,
    ImageEncodeError,
    ImageDecodeError,
}

impl<'r> Responder<'r, 'static> for Error {
    fn respond_to(self, req: &'r Request<'_>) -> Result<'static> {
        Response::build_from(Json(self.clone()).respond_to(req)?)
            .status(match self {
                _ => Status::InternalServerError,
            })
            .ok()
    }
}
