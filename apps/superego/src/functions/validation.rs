use crate::error::Error;

const MIN_PASSWORD_LENGTH: usize = 8;
const MAX_PASSWORD_LENGTH: usize = 1024;

pub fn validate_password(password: &str) -> Result<(), Error> {
    if password.len() < MIN_PASSWORD_LENGTH {
        return Err(Error::new(
            "PasswordTooShort",
            axum::http::StatusCode::BAD_REQUEST,
            &format!(
                "Password must be at least {} characters long",
                MIN_PASSWORD_LENGTH
            ),
        ));
    }
    if password.len() > MAX_PASSWORD_LENGTH {
        return Err(Error::new(
            "PasswordTooLong",
            axum::http::StatusCode::BAD_REQUEST,
            &format!(
                "Password must be at most {} characters long",
                MAX_PASSWORD_LENGTH
            ),
        ));
    }
    Ok(())
}
