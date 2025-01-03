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
    #[error("{0}")]
    RedisError(#[from] fred::error::RedisError),
    #[error("{0}")]
    SerdeError(#[from] serde_json::Error),

    #[error("Unknown internal server error")]
    InternalServerError { message: String },

    #[error("Wrong password")]
    WrongPassword,
    #[error("Network error")]
    NetworkError,
    #[error("WebSocket terminated")]
    WebSocketTerminated,
    #[error("Captcha failed")]
    CaptchaFailed,
    #[error("Token expired")]
    TokenExpired,
    #[error("Wrong authentication type provided")]
    WrongAuthenticationType,
    #[error("JWT is invalid")]
    JwtValidationError { message: String },

    #[error("Templating error")]
    TemplatingError,
    #[error("Mail error")]
    MailError,
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
            Error::Forbidden { .. } => StatusCode::FORBIDDEN,
            Error::ValidationFailed => StatusCode::BAD_REQUEST,
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
        Self::Miscallaneous {
            code: "S3Error".to_string(),
            status: StatusCode::INTERNAL_SERVER_ERROR,
            message: err.to_string(),
        }
    }
}

impl From<ImageError> for Error {
    fn from(err: ImageError) -> Self {
        Self::Miscallaneous {
            code: "ImageError".to_string(),
            status: StatusCode::INTERNAL_SERVER_ERROR,
            message: err.to_string(),
        }
    }
}

pub type Result<T, E = Error> = std::result::Result<T, E>;
