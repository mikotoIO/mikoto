use std::sync::OnceLock;

use aide::OperationIo;
use axum::{extract::FromRequestParts, http::request::Parts};
use chrono::{TimeDelta, Utc};
use jsonwebtoken::{Algorithm, DecodingKey, EncodingKey, Header, Validation};

use crate::{entities::Account, env::env, error::Error};

// Represents a user claim.
// This can be used as an Axum extractor as well.
#[derive(Debug, Clone, Serialize, Deserialize, OperationIo)]
pub struct Claims {
    pub exp: usize,  // expiry
    pub sub: String, // user ID
    pub iss: String, // issuer
    pub aud: String, // audience
    /// "bot" for bot tokens, absent for regular user tokens
    #[serde(skip_serializing_if = "Option::is_none")]
    pub category: Option<String>,
}

fn header() -> &'static Header {
    static HEADER: OnceLock<Header> = OnceLock::new();
    HEADER.get_or_init(Header::default)
}

pub struct JwtKey {
    encoder: EncodingKey,
    decoder: DecodingKey,
    validator: Validation,
}

const JWT_AUDIENCE: &str = "mikoto";

impl JwtKey {
    fn from_secret(secret: &str, issuer: &str) -> Self {
        let mut validator = Validation::new(Algorithm::HS256);
        validator.set_issuer(&[issuer]);
        validator.set_audience(&[JWT_AUDIENCE]);
        Self {
            encoder: EncodingKey::from_secret(secret.as_ref()),
            decoder: DecodingKey::from_secret(secret.as_ref()),
            validator,
        }
    }
}

pub fn jwt_key() -> &'static JwtKey {
    static KEY: OnceLock<JwtKey> = OnceLock::new();
    KEY.get_or_init(|| JwtKey::from_secret(env().secret.as_ref(), env().issuer.as_ref()))
}

impl Claims {
    pub fn encode(&self, key: &JwtKey) -> Result<String, Error> {
        Ok(jsonwebtoken::encode(header(), self, &key.encoder)?)
    }

    pub fn decode(token: &str, key: &JwtKey) -> Result<Self, Error> {
        Ok(jsonwebtoken::decode::<Self>(token, &key.decoder, &key.validator)?.claims)
    }
}

impl From<&Account> for Claims {
    fn from(user: &Account) -> Self {
        let expiry = Utc::now() + TimeDelta::hours(1);
        Self {
            exp: expiry.timestamp() as usize,
            sub: user.id.to_string(),
            iss: env().issuer.clone(),
            aud: JWT_AUDIENCE.to_string(),
            category: None,
        }
    }
}

impl Claims {
    /// Create claims for a bot user. Bot tokens expire after 24 hours.
    pub fn for_bot(bot_user_id: uuid::Uuid) -> Self {
        let expiry = Utc::now() + TimeDelta::hours(24);
        Self {
            exp: expiry.timestamp() as usize,
            sub: bot_user_id.to_string(),
            iss: env().issuer.clone(),
            aud: JWT_AUDIENCE.to_string(),
            category: Some("bot".to_string()),
        }
    }
}

fn parse_bearer_token(token: &str) -> Result<String, Error> {
    let parts: Vec<&str> = token.split_whitespace().collect();
    if parts.len() != 2 {
        return Err(Error::unauthorized("Invalid authorization header"));
    }
    if parts[0] != "Bearer" {
        return Err(Error::unauthorized("Invalid authorization header"));
    }
    Ok(parts[1].to_string())
}

#[async_trait]
impl<S> FromRequestParts<S> for Claims
where
    S: Send + Sync,
{
    type Rejection = Error;
    async fn from_request_parts(parts: &mut Parts, _: &S) -> Result<Self, Self::Rejection> {
        let auth_header = parts
            .headers
            .get("authorization")
            .ok_or(Error::unauthorized("Invalid authorization header"))?
            .to_str()
            .map_err(|_| Error::unauthorized("Invalid authorization header"))?;
        let claims = Claims::decode(&parse_bearer_token(auth_header)?, jwt_key())?;
        parts.extensions.insert(claims.clone());
        Ok(claims)
    }
}

#[cfg(test)]
mod tests {
    use chrono::{TimeDelta, Utc};

    use crate::{entities::Account, functions::jwt::Claims};

    use super::{JwtKey, JWT_AUDIENCE};

    const TEST_ISSUER: &str = "test-issuer";

    fn test_claims(acc: &Account) -> Claims {
        Claims {
            exp: (Utc::now() + TimeDelta::hours(1)).timestamp() as usize,
            sub: acc.id.to_string(),
            iss: TEST_ISSUER.to_string(),
            aud: JWT_AUDIENCE.to_string(),
            category: None,
        }
    }

    #[test]
    fn test_encode_decode() {
        let key = JwtKey::from_secret("testsecretpleaseignore", TEST_ISSUER);
        let acc = Account {
            id: uuid::Uuid::new_v4(),
            email: "".to_string(),    // irrelevant
            passhash: "".to_string(), // also irrelevant
        };
        let token = test_claims(&acc).encode(&key).unwrap();
        let claims = Claims::decode(&token, &key).unwrap();
        assert_eq!(claims.sub, acc.id.to_string());
    }

    #[test]
    fn test_encode_decode_wrong_secret() {
        let key = JwtKey::from_secret("testsecretpleaseignore", TEST_ISSUER);
        let wrong_key = JwtKey::from_secret("wrongsecretlol", TEST_ISSUER);
        let acc = Account {
            id: uuid::Uuid::new_v4(),
            email: "".to_string(),    // irrelevant
            passhash: "".to_string(), // also irrelevant
        };
        let token = test_claims(&acc).encode(&key).unwrap();
        let claims = Claims::decode(&token, &wrong_key);
        assert!(claims.is_err());
    }
}
