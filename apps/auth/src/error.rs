use aide::OperationIo;
use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use bcrypt::BcryptError;
use serde_json::json;

#[derive(Serialize, Debug, OperationIo)]
#[serde(rename_all = "camelCase", tag = "code")]
pub enum Error {
    NotFound,
    WrongPassword,
    NetworkError,
    CaptchaFailed,
    TokenExpired,
    WrongAuthenticationType,
    JwtValidationError { message: String },
    InitializationFailed { message: String },
    DatabaseError { message: String },
    InternalServerError,
}

impl From<sqlx::Error> for Error {
    fn from(err: sqlx::Error) -> Self {
        Self::InitializationFailed {
            message: err.to_string(),
        }
    }
}

impl From<BcryptError> for Error {
    fn from(_: BcryptError) -> Self {
        Self::InternalServerError
    }
}

impl From<jsonwebtoken::errors::Error> for Error {
    fn from(err: jsonwebtoken::errors::Error) -> Self {
        Self::JwtValidationError {
            message: err.to_string(),
        }
    }
}

impl From<hcaptcha::HcaptchaError> for Error {
    fn from(_: hcaptcha::HcaptchaError) -> Self {
        Self::CaptchaFailed
    }
}

impl IntoResponse for Error {
    fn into_response(self) -> Response {
        let status = match self {
            Error::NotFound => StatusCode::NOT_FOUND,
            Error::WrongPassword => StatusCode::UNAUTHORIZED,
            _ => StatusCode::INTERNAL_SERVER_ERROR,
        };

        (status, Json(json!(self).to_string())).into_response()
    }
}
