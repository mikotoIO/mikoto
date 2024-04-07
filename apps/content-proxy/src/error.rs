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
    BadRequest,
    NotFound,
    InternalServerError,
    FileTooLarge,
    FileBufferError,
    StorageError { internal: String },
    ImageError { internal: String },
}

impl IntoResponse for Error {
    fn into_response(self) -> Response {
        let status = match self {
            Error::NotFound => StatusCode::NOT_FOUND,
            Error::BadRequest => StatusCode::BAD_REQUEST,
            Error::FileTooLarge => StatusCode::PAYLOAD_TOO_LARGE,
            _ => StatusCode::INTERNAL_SERVER_ERROR,
        };

        (status, Json(json!(self).to_string())).into_response()
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
