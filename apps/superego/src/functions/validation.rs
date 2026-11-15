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

#[cfg(test)]
mod tests {
    use super::*;

    fn code(result: Result<(), Error>) -> Option<String> {
        match result {
            Ok(()) => None,
            Err(Error::Miscallaneous { code, .. }) => Some(code),
            Err(e) => panic!("unexpected error: {e:?}"),
        }
    }

    #[test]
    fn accepts_passwords_within_bounds() {
        assert_eq!(
            code(validate_password(&"a".repeat(MIN_PASSWORD_LENGTH))),
            None
        );
        assert_eq!(
            code(validate_password(&"a".repeat(MAX_PASSWORD_LENGTH))),
            None
        );
        assert_eq!(
            code(validate_password("correct horse battery staple")),
            None
        );
    }

    #[test]
    fn rejects_short_passwords() {
        assert_eq!(
            code(validate_password("")).as_deref(),
            Some("PasswordTooShort")
        );
        assert_eq!(
            code(validate_password(&"a".repeat(MIN_PASSWORD_LENGTH - 1))).as_deref(),
            Some("PasswordTooShort")
        );
    }

    #[test]
    fn rejects_long_passwords() {
        assert_eq!(
            code(validate_password(&"a".repeat(MAX_PASSWORD_LENGTH + 1))).as_deref(),
            Some("PasswordTooLong")
        );
    }
}
