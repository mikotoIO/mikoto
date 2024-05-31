use std::sync::OnceLock;

use jsonwebtoken::{Algorithm, DecodingKey, EncodingKey, Header, Validation};

use crate::{entities::Account, env::env, error::Error};

#[derive(Debug, Serialize, Deserialize)]
pub struct UserClaims {
    pub exp: usize,  // expiry
    pub sub: String, // user ID
    pub iss: String, // issuer
}

fn header() -> &'static Header {
    static HEADER: OnceLock<Header> = OnceLock::new();
    HEADER.get_or_init(|| Header::default())
}

// TODO: key rotation
fn encoding_key() -> &'static EncodingKey {
    static HEADER: OnceLock<EncodingKey> = OnceLock::new();
    HEADER.get_or_init(|| EncodingKey::from_secret(env().secret.as_ref()))
}

fn decoding_key() -> &'static DecodingKey {
    static HEADER: OnceLock<DecodingKey> = OnceLock::new();
    HEADER.get_or_init(|| DecodingKey::from_secret(env().secret.as_ref()))
}

fn validator() -> &'static Validation {
    static VALIDATOR: OnceLock<Validation> = OnceLock::new();
    VALIDATOR.get_or_init(|| Validation::new(Algorithm::ES256))
}

impl UserClaims {
    pub fn encode(&self) -> Result<String, Error> {
        Ok(jsonwebtoken::encode(header(), self, &encoding_key())?)
    }

    pub fn decode(token: &str) -> Result<Self, Error> {
        Ok(jsonwebtoken::decode::<Self>(token, &decoding_key(), &validator())?.claims)
    }
}

impl From<Account> for UserClaims {
    fn from(user: Account) -> Self {
        Self {
            exp: time::OffsetDateTime::now_utc().unix_timestamp() as usize,
            sub: user.id.to_string(),
            iss: env().issuer.clone(),
        }
    }
}
