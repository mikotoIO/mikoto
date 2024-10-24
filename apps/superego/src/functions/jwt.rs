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
    pub exp: usize, // expiry
    pub sub: String, // user ID
                    // pub iss: String, // issuer
}

fn header() -> &'static Header {
    static HEADER: OnceLock<Header> = OnceLock::new();
    HEADER.get_or_init(|| Header::default())
}

pub struct JwtKey {
    encoder: EncodingKey,
    decoder: DecodingKey,
    validator: Validation,
}

impl JwtKey {
    fn from_secret(secret: &str) -> Self {
        Self {
            encoder: EncodingKey::from_secret(secret.as_ref()),
            decoder: DecodingKey::from_secret(secret.as_ref()),
            validator: Validation::new(Algorithm::HS256),
        }
    }
}

pub fn jwt_key() -> &'static JwtKey {
    static KEY: OnceLock<JwtKey> = OnceLock::new();
    KEY.get_or_init(|| JwtKey::from_secret(env().secret.as_ref()))
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
            exp: expiry.timestamp_millis() as usize,
            sub: user.id.to_string(),
            // iss: env().issuer.clone(),
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
    use crate::{entities::Account, functions::jwt::Claims};

    use super::JwtKey;

    #[test]
    fn test_encode_decode() {
        let key = JwtKey::from_secret("testsecretpleaseignore");
        let acc = Account {
            id: uuid::Uuid::new_v4(),
            email: "".to_string(),    // irrelevant
            passhash: "".to_string(), // also irrelevant
        };
        let token = Claims::from(&acc).encode(&key).unwrap();
        let claims = Claims::decode(&token, &key).unwrap();
        assert_eq!(claims.sub, acc.id.to_string());
    }

    #[test]
    fn test_encode_decode_wrong_secret() {
        println!("testing!!!");
        let key = JwtKey::from_secret("testsecretpleaseignore");
        let wrong_key = JwtKey::from_secret("wrongsecretlol");
        let acc = Account {
            id: uuid::Uuid::new_v4(),
            email: "".to_string(),    // irrelevant
            passhash: "".to_string(), // also irrelevant
        };
        let token = Claims::from(&acc).encode(&key).unwrap();
        let claims = Claims::decode(&token, &wrong_key);
        assert!(claims.is_err());
    }
}
