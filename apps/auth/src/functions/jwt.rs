use std::sync::OnceLock;

use jsonwebtoken::{EncodingKey, Header};

use crate::{entities::User, env::env, error::Error};

#[derive(Debug, Serialize, Deserialize)]
pub struct UserClaims {
    pub exp: usize,  // expiry
    pub sub: String, // user ID
}

fn header() -> &'static Header {
    static HEADER: OnceLock<Header> = OnceLock::new();
    HEADER.get_or_init(|| Header::default())
}

fn encoding_key() -> &'static EncodingKey {
    static HEADER: OnceLock<EncodingKey> = OnceLock::new();

    HEADER.get_or_init(|| EncodingKey::from_secret(env().superego_secret.as_ref()))
    // TODO: support key rotation
}

impl UserClaims {
    pub fn encode(&self) -> Result<String, Error> {
        Ok(jsonwebtoken::encode(header(), self, &encoding_key())?)
    }
}

impl From<User> for UserClaims {
    fn from(user: User) -> Self {
        Self {
            exp: time::OffsetDateTime::now_utc().unix_timestamp() as usize,
            sub: user.id.to_string(),
        }
    }
}
