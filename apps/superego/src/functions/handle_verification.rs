use std::time::Duration;

use base64::{engine::general_purpose::STANDARD as BASE64, Engine};
use chrono::{DateTime, Utc};
use ed25519_dalek::{Signature, Signer, SigningKey, Verifier, VerifyingKey};
use hickory_resolver::Resolver;
use sha3::{Digest, Sha3_256};
use uuid::Uuid;

use crate::{
    entities::HandleAttestation,
    env::env,
    error::{Error, Result},
    model,
};

/// DNS TXT record prefix for handle verification
const DNS_TXT_PREFIX: &str = "_mikoto";

/// Verification challenge sent to the user
model!(
    pub struct VerificationChallenge {
        /// The domain being verified
        pub handle: String,
        /// The entity type (user or space)
        pub entity_type: String,
        /// The entity ID
        pub entity_id: Uuid,
        /// Random nonce for this challenge
        pub nonce: String,
        /// When this challenge was created
        pub created_at: DateTime<Utc>,
        /// The DNS TXT record to add
        pub dns_txt_record: String,
        /// The DNS TXT record name (subdomain)
        pub dns_txt_name: String,
        /// The well-known file URL
        pub well_known_url: String,
        /// The well-known file content
        pub well_known_content: String,
    }
);

/// Request to initiate handle verification
model!(
    pub struct VerifyHandleRequest {
        /// The domain to verify
        pub handle: String,
    }
);

/// Result of a verification attempt
model!(
    pub struct VerificationResult {
        pub success: bool,
        pub method: Option<String>,
        pub error: Option<String>,
    }
);

/// Well-known file content structure
model!(
    pub struct WellKnownContent {
        pub home_instance: String,
        pub entity_type: String,
        pub entity_id: Uuid,
    }
);

/// Generate a verification challenge for a custom domain
pub fn generate_challenge(
    handle: &str,
    entity_type: &str,
    entity_id: Uuid,
) -> Result<VerificationChallenge> {
    let nonce = nanoid::nanoid!(32);
    let instance = &env().handle.domain;

    // DNS TXT record content
    let dns_txt_record = format!(
        "v=1 home={} {}={} nonce={}",
        instance, entity_type, entity_id, nonce
    );

    // DNS TXT record name: _mikoto.domain.com
    let dns_txt_name = format!("{}.{}", DNS_TXT_PREFIX, handle);

    // Well-known file URL and content
    let well_known_url = format!("https://{}/.well-known/mikoto.json", handle);
    let well_known_content = serde_json::to_string_pretty(&WellKnownContent {
        home_instance: instance.clone(),
        entity_type: entity_type.to_string(),
        entity_id,
    })?;

    Ok(VerificationChallenge {
        handle: handle.to_string(),
        entity_type: entity_type.to_string(),
        entity_id,
        nonce,
        created_at: Utc::now(),
        dns_txt_record,
        dns_txt_name,
        well_known_url,
        well_known_content,
    })
}

/// Verify a custom domain via DNS TXT record
pub async fn verify_dns(handle: &str, entity_type: &str, entity_id: Uuid) -> Result<bool> {
    let instance = &env().handle.domain;

    // Create resolver using system configuration
    let resolver = Resolver::builder_tokio()
        .map_err(|e| Error::internal(&format!("Failed to create DNS resolver: {}", e)))?
        .build();

    // Look up TXT records at _mikoto.domain.com
    let txt_name = format!("{}.{}.", DNS_TXT_PREFIX, handle);

    let lookup = match resolver.txt_lookup(&txt_name).await {
        Ok(lookup) => lookup,
        Err(_) => return Ok(false),
    };

    // Check if any TXT record matches our expected format
    for record in lookup.iter() {
        let txt = record.to_string();

        // Parse the TXT record
        if let Some(parsed) = parse_dns_txt(&txt) {
            if parsed.home == instance.as_str()
                && parsed.entity_type == entity_type
                && parsed.entity_id == entity_id
            {
                return Ok(true);
            }
        }
    }

    Ok(false)
}

/// Parsed DNS TXT record
struct ParsedDnsTxt {
    home: String,
    entity_type: String,
    entity_id: Uuid,
}

/// Parse a DNS TXT record in the format: v=1 home=mikoto.io user=uuid nonce=xxx
fn parse_dns_txt(txt: &str) -> Option<ParsedDnsTxt> {
    let mut version = None;
    let mut home = None;
    let mut entity_type = None;
    let mut entity_id = None;

    for part in txt.split_whitespace() {
        if let Some((key, value)) = part.split_once('=') {
            match key {
                "v" => version = Some(value),
                "home" => home = Some(value.to_string()),
                "user" => {
                    entity_type = Some("user");
                    entity_id = Uuid::parse_str(value).ok();
                }
                "space" => {
                    entity_type = Some("space");
                    entity_id = Uuid::parse_str(value).ok();
                }
                _ => {}
            }
        }
    }

    if version == Some("1") {
        if let (Some(home), Some(entity_type), Some(entity_id)) = (home, entity_type, entity_id) {
            return Some(ParsedDnsTxt {
                home,
                entity_type: entity_type.to_string(),
                entity_id,
            });
        }
    }

    None
}

/// Verify a custom domain via well-known file
pub async fn verify_well_known(handle: &str, entity_type: &str, entity_id: Uuid) -> Result<bool> {
    let instance = &env().handle.domain;

    let url = format!("https://{}/.well-known/mikoto.json", handle);

    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(10))
        .build()?;

    let response = match client.get(&url).send().await {
        Ok(r) => r,
        Err(_) => return Ok(false),
    };

    if !response.status().is_success() {
        return Ok(false);
    }

    let content: WellKnownContent = match response.json().await {
        Ok(c) => c,
        Err(_) => return Ok(false),
    };

    Ok(content.home_instance == *instance
        && content.entity_type == entity_type
        && content.entity_id == entity_id)
}

/// Verify a custom domain using both methods (DNS first, then well-known)
pub async fn verify_handle(
    handle: &str,
    entity_type: &str,
    entity_id: Uuid,
) -> Result<VerificationResult> {
    // Try DNS verification first
    if verify_dns(handle, entity_type, entity_id).await? {
        return Ok(VerificationResult {
            success: true,
            method: Some("dns".to_string()),
            error: None,
        });
    }

    // Fall back to well-known file
    if verify_well_known(handle, entity_type, entity_id).await? {
        return Ok(VerificationResult {
            success: true,
            method: Some("well-known".to_string()),
            error: None,
        });
    }

    Ok(VerificationResult {
        success: false,
        method: None,
        error: Some("Could not verify domain ownership. Please ensure you have added the DNS TXT record or well-known file.".to_string()),
    })
}

/// Get the instance signing key from environment
fn get_signing_key() -> Result<Option<SigningKey>> {
    let Some(private_key_b64) = &env().handle.private_key else {
        return Ok(None);
    };

    let private_key_bytes = BASE64.decode(private_key_b64).map_err(|_| {
        Error::internal("Invalid HANDLE_PRIVATE_KEY: not valid base64")
    })?;

    if private_key_bytes.len() != 32 {
        return Err(Error::internal(
            "Invalid HANDLE_PRIVATE_KEY: must be 32 bytes",
        ));
    }

    let mut key_bytes = [0u8; 32];
    key_bytes.copy_from_slice(&private_key_bytes);

    Ok(Some(SigningKey::from_bytes(&key_bytes)))
}

/// Get the instance verifying key from environment
pub fn get_verifying_key() -> Result<Option<VerifyingKey>> {
    let Some(public_key_b64) = &env().handle.public_key else {
        return Ok(None);
    };

    let public_key_bytes = BASE64.decode(public_key_b64).map_err(|_| {
        Error::internal("Invalid HANDLE_PUBLIC_KEY: not valid base64")
    })?;

    if public_key_bytes.len() != 32 {
        return Err(Error::internal(
            "Invalid HANDLE_PUBLIC_KEY: must be 32 bytes",
        ));
    }

    let mut key_bytes = [0u8; 32];
    key_bytes.copy_from_slice(&public_key_bytes);

    VerifyingKey::from_bytes(&key_bytes)
        .map(Some)
        .map_err(|_| Error::internal("Invalid HANDLE_PUBLIC_KEY: not a valid Ed25519 public key"))
}

/// Create a signed attestation for a verified handle
pub fn create_attestation(
    handle: &str,
    entity_type: &str,
    entity_id: Uuid,
    dns_record: Option<&str>,
) -> Result<HandleAttestation> {
    let Some(signing_key) = get_signing_key()? else {
        return Err(Error::internal(
            "Cannot create attestation: HANDLE_PRIVATE_KEY not configured",
        ));
    };

    let instance = &env().handle.domain;
    let verified_at = Utc::now().to_rfc3339();

    // Hash the DNS record if provided
    let dns_record_hash = dns_record.map(|record| {
        let mut hasher = Sha3_256::new();
        hasher.update(record.as_bytes());
        format!("sha256:{}", hex::encode(hasher.finalize()))
    });

    // Create the attestation data to sign
    let attestation_data = format!(
        "{}:{}:{}:{}:{}",
        handle,
        entity_type,
        entity_id,
        instance,
        verified_at
    );

    // Sign the attestation
    let signature: Signature = signing_key.sign(attestation_data.as_bytes());
    let signature_b64 = BASE64.encode(signature.to_bytes());

    Ok(HandleAttestation {
        handle: handle.to_string(),
        entity_type: entity_type.to_string(),
        entity_id,
        instance: instance.clone(),
        verified_at,
        dns_record_hash,
        signature: signature_b64,
    })
}

/// Verify an attestation's signature
pub fn verify_attestation(attestation: &HandleAttestation) -> Result<bool> {
    let Some(verifying_key) = get_verifying_key()? else {
        return Err(Error::internal(
            "Cannot verify attestation: HANDLE_PUBLIC_KEY not configured",
        ));
    };

    // Reconstruct the signed data
    let attestation_data = format!(
        "{}:{}:{}:{}:{}",
        attestation.handle,
        attestation.entity_type,
        attestation.entity_id,
        attestation.instance,
        attestation.verified_at
    );

    // Decode and verify the signature
    let signature_bytes = BASE64.decode(&attestation.signature).map_err(|_| {
        Error::new(
            "InvalidAttestation",
            axum::http::StatusCode::BAD_REQUEST,
            "Invalid attestation signature format",
        )
    })?;

    let signature = Signature::from_slice(&signature_bytes).map_err(|_| {
        Error::new(
            "InvalidAttestation",
            axum::http::StatusCode::BAD_REQUEST,
            "Invalid attestation signature",
        )
    })?;

    Ok(verifying_key
        .verify(attestation_data.as_bytes(), &signature)
        .is_ok())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_dns_txt() {
        let txt = "v=1 home=mikoto.io user=550e8400-e29b-41d4-a716-446655440000 nonce=abc123";
        let parsed = parse_dns_txt(txt).expect("should parse");
        assert_eq!(parsed.home, "mikoto.io");
        assert_eq!(parsed.entity_type, "user");
        assert_eq!(
            parsed.entity_id,
            Uuid::parse_str("550e8400-e29b-41d4-a716-446655440000").unwrap()
        );
    }

    #[test]
    fn test_parse_dns_txt_space() {
        let txt = "v=1 home=example.com space=550e8400-e29b-41d4-a716-446655440000 nonce=xyz";
        let parsed = parse_dns_txt(txt).expect("should parse");
        assert_eq!(parsed.home, "example.com");
        assert_eq!(parsed.entity_type, "space");
    }

    #[test]
    fn test_parse_dns_txt_invalid() {
        assert!(parse_dns_txt("invalid").is_none());
        assert!(parse_dns_txt("v=2 home=x user=invalid").is_none());
    }
}
