use std::sync::OnceLock;

use aide::OperationIo;
use axum::{async_trait, extract::FromRequestParts, http::request::Parts};
use jsonwebtoken::{Algorithm, DecodingKey, EncodingKey, Header, Validation};

use crate::{entities::Account, env::env, error::Error};

// Represents a user claim.
// This can be used as an Axum extractor as well.
#[derive(Debug, Clone, Serialize, Deserialize, OperationIo)]
pub struct Claims {
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

impl Claims {
    pub fn encode(&self) -> Result<String, Error> {
        Ok(jsonwebtoken::encode(header(), self, &encoding_key())?)
    }

    pub fn decode(token: &str) -> Result<Self, Error> {
        Ok(jsonwebtoken::decode::<Self>(token, &decoding_key(), &validator())?.claims)
    }
}

impl From<Account> for Claims {
    fn from(user: Account) -> Self {
        Self {
            exp: time::OffsetDateTime::now_utc().unix_timestamp() as usize,
            sub: user.id.to_string(),
            iss: env().issuer.clone(),
        }
    }
}

fn parse_bearer_token(token: &str) -> Result<String, Error> {
    let parts: Vec<&str> = token.split_whitespace().collect();
    if parts.len() != 2 {
        return Err(Error::Unauthorized {
            message: "Invalid authorization header".to_string(),
        });
    }
    if parts[0] != "Bearer" {
        return Err(Error::Unauthorized {
            message: "Invalid authorization header".to_string(),
        });
    }
    Ok(parts[1].to_string())
}

#[async_trait]
impl<S> FromRequestParts<S> for Claims
where
    S: Send + Sync,
{
    type Rejection = Error;
    async fn from_request_parts(parts: &mut Parts, _: &S) -> Result<Self, Error> {
        let auth_header = parts
            .headers
            .get("authorization")
            .ok_or(Error::Unauthorized {
                message: "No authorization header".to_string(),
            })?
            .to_str()
            .map_err(|_| Error::Unauthorized {
                message: "Invalid authorization header".to_string(),
            })?;
        let claims = Claims::decode(&parse_bearer_token(auth_header)?)?;
        Ok(claims)
    }
}
