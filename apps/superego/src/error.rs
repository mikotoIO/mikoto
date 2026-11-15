use aide::OperationIo;
use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use bcrypt::BcryptError;
use image::ImageError;
use s3::error::S3Error;
use serde_json::json;

#[derive(Debug, OperationIo, strum::AsRefStr, thiserror::Error)]
pub enum Error {
    #[error("Not found")]
    NotFound,
    #[error("Bad request")]
    BadRequest,
    #[error("{message}")]
    Unauthorized { message: String },
    #[error("{message}")]
    InsufficientPermissions { message: String },
    #[error("{message}")]
    Forbidden { message: String },
    #[error("Validation failed")]
    ValidationFailed,
    #[error("File too large")]
    FileTooLarge,

    // errors relating to services
    #[error("{0}")]
    DatabaseError(#[from] sqlx::Error),
    #[error("Cache error")]
    RedisError(#[from] fred::error::Error),
    #[error("{0}")]
    SerdeError(#[from] serde_json::Error),

    #[error("{message}")]
    InternalServerError { message: String },

    #[error("Wrong password")]
    WrongPassword,
    #[error("Network error")]
    NetworkError,
    #[error("WebSocket terminated")]
    WebSocketTerminated,
    #[error("Token expired")]
    TokenExpired,
    #[error("Wrong authentication type provided")]
    WrongAuthenticationType,
    #[error("JWT is invalid")]
    JwtValidationError { message: String },

    #[error("Mail error: {message}")]
    MailError { message: String },
    #[error("IO error")]
    IOError(#[from] std::io::Error),
    #[error("Unimplemented so far")]
    Todo,

    #[error("{message}")]
    Miscallaneous {
        code: String,
        status: StatusCode,
        message: String,
    },
}

impl Error {
    pub fn new(code: &str, status: StatusCode, message: &str) -> Self {
        Self::Miscallaneous {
            code: code.to_string(),
            status,
            message: message.to_string(),
        }
    }

    pub fn internal(message: &str) -> Self {
        Self::InternalServerError {
            message: message.to_string(),
        }
    }

    pub fn unauthorized(message: &str) -> Self {
        Self::Unauthorized {
            message: message.to_string(),
        }
    }

    pub fn forbidden(message: &str) -> Self {
        Self::Forbidden {
            message: message.to_string(),
        }
    }
}

impl IntoResponse for Error {
    fn into_response(self) -> Response {
        let status = match self {
            Error::Miscallaneous { status, .. } => status,
            Error::NotFound => StatusCode::NOT_FOUND,
            Error::WrongPassword => StatusCode::UNAUTHORIZED,
            Error::InsufficientPermissions { .. } => StatusCode::FORBIDDEN,

            Error::Unauthorized { .. } => StatusCode::UNAUTHORIZED,
            Error::TokenExpired => StatusCode::UNAUTHORIZED,
            Error::JwtValidationError { .. } => StatusCode::UNAUTHORIZED,
            Error::WrongAuthenticationType => StatusCode::UNAUTHORIZED,
            Error::Forbidden { .. } => StatusCode::FORBIDDEN,
            Error::ValidationFailed => StatusCode::BAD_REQUEST,
            Error::BadRequest => StatusCode::BAD_REQUEST,
            Error::FileTooLarge => StatusCode::BAD_REQUEST,
            _ => StatusCode::INTERNAL_SERVER_ERROR,
        };

        (
            status,
            Json(json!({
                "code": self.as_ref(),
                "message": self.to_string(),
            })),
        )
            .into_response()
    }
}

impl From<uuid::Error> for Error {
    fn from(_: uuid::Error) -> Self {
        Self::ValidationFailed
    }
}

impl From<BcryptError> for Error {
    fn from(_: BcryptError) -> Self {
        Self::InternalServerError {
            message: "Failed to hash password".to_string(),
        }
    }
}

impl From<jsonwebtoken::errors::Error> for Error {
    fn from(err: jsonwebtoken::errors::Error) -> Self {
        Self::JwtValidationError {
            message: err.to_string(),
        }
    }
}

impl From<S3Error> for Error {
    fn from(err: S3Error) -> Self {
        log::error!("S3 error: {}", err);
        Self::Miscallaneous {
            code: "S3Error".to_string(),
            status: StatusCode::INTERNAL_SERVER_ERROR,
            message: "Internal storage error".to_string(),
        }
    }
}

impl From<ImageError> for Error {
    fn from(err: ImageError) -> Self {
        log::error!("Image error: {}", err);
        Self::Miscallaneous {
            code: "ImageError".to_string(),
            status: StatusCode::INTERNAL_SERVER_ERROR,
            message: "Image processing error".to_string(),
        }
    }
}

impl From<reqwest::Error> for Error {
    fn from(err: reqwest::Error) -> Self {
        log::error!("Network error: {}", err);
        Self::Miscallaneous {
            code: "NetworkError".to_string(),
            status: StatusCode::BAD_GATEWAY,
            message: "Network error".to_string(),
        }
    }
}

pub type Result<T, E = Error> = std::result::Result<T, E>;

#[cfg(test)]
mod tests {
    use axum::body::to_bytes;

    use super::*;

    async fn render(err: Error) -> (StatusCode, serde_json::Value) {
        let res = err.into_response();
        let status = res.status();
        let body = to_bytes(res.into_body(), usize::MAX).await.unwrap();
        (status, serde_json::from_slice(&body).unwrap())
    }

    #[tokio::test]
    async fn maps_errors_to_status_codes() {
        let cases = [
            (Error::NotFound, StatusCode::NOT_FOUND),
            (Error::BadRequest, StatusCode::BAD_REQUEST),
            (Error::ValidationFailed, StatusCode::BAD_REQUEST),
            (Error::FileTooLarge, StatusCode::BAD_REQUEST),
            (Error::WrongPassword, StatusCode::UNAUTHORIZED),
            (Error::TokenExpired, StatusCode::UNAUTHORIZED),
            (Error::WrongAuthenticationType, StatusCode::UNAUTHORIZED),
            (Error::unauthorized("no"), StatusCode::UNAUTHORIZED),
            (Error::forbidden("no"), StatusCode::FORBIDDEN),
            (
                Error::InsufficientPermissions {
                    message: "no".into(),
                },
                StatusCode::FORBIDDEN,
            ),
            (Error::internal("boom"), StatusCode::INTERNAL_SERVER_ERROR),
            (Error::Todo, StatusCode::INTERNAL_SERVER_ERROR),
            (
                Error::new("Teapot", StatusCode::IM_A_TEAPOT, "short and stout"),
                StatusCode::IM_A_TEAPOT,
            ),
        ];
        for (err, expected) in cases {
            let name = format!("{err:?}");
            let (status, _) = render(err).await;
            assert_eq!(status, expected, "{name}");
        }
    }

    #[tokio::test]
    async fn body_has_code_and_message() {
        let (_, body) = render(Error::NotFound).await;
        assert_eq!(body["code"], "NotFound");
        assert_eq!(body["message"], "Not found");

        let (_, body) = render(Error::forbidden("Not your space")).await;
        assert_eq!(body["code"], "Forbidden");
        assert_eq!(body["message"], "Not your space");
    }

    #[test]
    fn conversions() {
        assert!(matches!(
            Error::from(uuid::Uuid::parse_str("nope").unwrap_err()),
            Error::ValidationFailed
        ));
        let jwt_err =
            jsonwebtoken::errors::Error::from(jsonwebtoken::errors::ErrorKind::InvalidToken);
        assert!(matches!(
            Error::from(jwt_err),
            Error::JwtValidationError { .. }
        ));
    }
}
