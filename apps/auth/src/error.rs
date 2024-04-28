use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use bcrypt::BcryptError;
use serde_json::json;

#[derive(Serialize, Debug)]
#[serde(tag = "code")]
pub enum Error {
    InitializationFailed(String),
    DatabaseError(String),
    InternalServerError,
}

impl From<sqlx::Error> for Error {
    fn from(err: sqlx::Error) -> Self {
        Self::InitializationFailed(err.to_string())
    }
}

impl From<BcryptError> for Error {
    fn from(err: BcryptError) -> Self {
        Self::InternalServerError
    }
}

impl IntoResponse for Error {
    fn into_response(self) -> Response {
        let status = match self {
            _ => StatusCode::INTERNAL_SERVER_ERROR,
        };

        (status, Json(json!(self).to_string())).into_response()
    }
}
