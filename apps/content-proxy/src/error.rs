// define the error types
use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use s3::error::S3Error;

#[derive(Serialize, Debug)]
#[serde(tag = "code")]
pub enum Error {
    BadRequest { message: Option<String> },
    NotFound,
    Unauthorized,
    InternalServerError,
    InvalidContentType,
    FileTooLarge,
    FileBufferError,
    StorageError,
    ProxyError,
    ImageError,
}

impl IntoResponse for Error {
    fn into_response(self) -> Response {
        let status = match self {
            Error::NotFound => StatusCode::NOT_FOUND,
            Error::Unauthorized => StatusCode::UNAUTHORIZED,
            Error::BadRequest { .. } => StatusCode::BAD_REQUEST,
            Error::FileTooLarge => StatusCode::PAYLOAD_TOO_LARGE,
            _ => StatusCode::INTERNAL_SERVER_ERROR,
        };

        (status, Json(json!(self))).into_response()
    }
}

impl From<S3Error> for Error {
    fn from(err: S3Error) -> Self {
        log::error!("S3 error: {}", err);
        Error::StorageError
    }
}

impl From<image::ImageError> for Error {
    fn from(err: image::ImageError) -> Self {
        log::error!("Image error: {}", err);
        Error::ImageError
    }
}

impl From<reqwest::Error> for Error {
    fn from(err: reqwest::Error) -> Self {
        log::error!("Network error: {}", err);
        Error::ProxyError
    }
}
