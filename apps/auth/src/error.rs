use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde_json::json;

#[derive(Serialize, Debug)]
#[serde(tag = "code")]
pub enum Error {
    InternalServerError,
}

impl IntoResponse for Error {
    fn into_response(self) -> Response {
        let status = match self {
            _ => StatusCode::INTERNAL_SERVER_ERROR,
        };

        (status, Json(json!(self).to_string())).into_response()
    }
}
