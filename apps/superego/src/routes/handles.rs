use aide::axum::{
    routing::{get_with, post_with},
    ApiRouter, IntoApiResponse,
};
use axum::{extract::Path, Json};
use libdelve::{delegate_client::DelegateClient, types::{ChallengeRequest, VerificationToken}, VerificationMode};
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::{
    db::db,
    entities::{HandleVerificationRequest, VerifiedHandle},
    error::Error,
    functions::jwt::Claims,
    services::verifier,
};

#[derive(Debug, Serialize, Deserialize, JsonSchema)]
#[serde(rename_all = "camelCase")]
pub struct StartVerificationRequest {
    pub domain: String,
}

#[derive(Debug, Serialize, Deserialize, JsonSchema)]
#[serde(rename_all = "camelCase")]
pub struct StartVerificationResponse {
    pub request_id: Uuid,
    pub challenge: String,
    pub expires_at: chrono::DateTime<chrono::Utc>,
    pub mode: String,
    pub delegate_request_id: Option<String>,
    pub endpoint: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, JsonSchema)]
#[serde(rename_all = "camelCase")]
pub struct CompleteVerificationRequest {
    pub token: serde_json::Value,
}

#[derive(Debug, Serialize, Deserialize, JsonSchema)]
#[serde(rename_all = "camelCase")]
pub struct VerificationStatusResponse {
    pub status: String,
    pub handle: String,
    pub challenge: String,
    pub expires_at: chrono::DateTime<chrono::Utc>,
}

pub async fn start_verification(
    claims: Claims,
    Json(req): Json<StartVerificationRequest>,
) -> Result<impl IntoApiResponse, Error> {
    let user_id = Uuid::parse_str(&claims.sub)?;
    let verifier = verifier();
    let pool = db();

    // Discover handle configuration
    let config = verifier
        .discover(&req.domain)
        .await
        .map_err(|e| Error::internal(&format!("Failed to discover handle config: {}", e)))?;

    // Generate challenge
    let (challenge, expires_at) = verifier
        .create_challenge(&req.domain)
        .map_err(|e| Error::internal(&format!("Failed to create challenge: {}", e)))?;

    let mut delegate_request_id = None;
    let mut endpoint = None;

    // If delegate mode, submit challenge
    if config.mode == VerificationMode::Delegate {
        let delegate_endpoint = config
            .endpoint
            .as_ref()
            .ok_or_else(|| Error::internal(&"No delegate endpoint found".to_string()))?;

        endpoint = Some(delegate_endpoint.clone());

        let client = DelegateClient::new(delegate_endpoint);
        let env = crate::env::env();
        let challenge_req = ChallengeRequest {
            domain: req.domain.clone(),
            verifier_id: env.issuer.clone(),
            challenge: challenge.clone(),
            expires_at,
            metadata: None,
        };

        let response = client
            .submit_challenge(&challenge_req)
            .await
            .map_err(|e| {
                Error::internal(&format!("Failed to submit challenge to delegate: {}", e))
            })?;

        delegate_request_id = Some(response.request_id);
    }

    // Store verification request
    let verification_request = HandleVerificationRequest::create(
        user_id,
        &req.domain,
        &challenge,
        expires_at,
        delegate_request_id.clone(),
        pool,
    )
    .await?;

    Ok(Json(StartVerificationResponse {
        request_id: verification_request.id,
        challenge,
        expires_at,
        mode: format!("{:?}", config.mode),
        delegate_request_id,
        endpoint,
    }))
}

pub async fn complete_verification(
    claims: Claims,
    Path(request_id): Path<Uuid>,
    Json(req): Json<CompleteVerificationRequest>,
) -> Result<impl IntoApiResponse, Error> {
    let user_id = Uuid::parse_str(&claims.sub)?;
    let verifier = verifier();
    let pool = db();

    // Get verification request
    let verification_request = HandleVerificationRequest::get_by_id(request_id, pool)
        .await?
        .ok_or(Error::NotFound)?;

    // Verify user owns this request
    if verification_request.user_id != user_id {
        return Err(Error::unauthorized("Unauthorized"));
    }

    // Check if expired
    if verification_request.expires_at < chrono::Utc::now() {
        HandleVerificationRequest::update_status(request_id, "expired", pool).await?;
        return Err(Error::internal(&"Verification request expired".to_string()));
    }

    // Discover handle configuration again to get public key
    let config = verifier
        .discover(&verification_request.handle)
        .await
        .map_err(|e| Error::internal(&format!("Failed to discover handle config: {}", e)))?;

    // Parse and verify the token
    let token: VerificationToken = serde_json::from_value(req.token)
        .map_err(|e| Error::internal(&format!("Invalid token format: {}", e)))?;

    verifier
        .verify_token(
            &token,
            &verification_request.handle,
            &verification_request.challenge,
            &config.public_key,
        )
        .map_err(|e| Error::internal(&format!("Token verification failed: {}", e)))?;

    // Create verified handle
    let verified_handle = VerifiedHandle::create(
        user_id,
        &verification_request.handle,
        &config.public_key,
        pool,
    )
    .await?;

    // Update request status
    HandleVerificationRequest::update_status(request_id, "completed", pool).await?;

    Ok(Json(verified_handle))
}

pub async fn get_verification_status(
    claims: Claims,
    Path(request_id): Path<Uuid>,
) -> Result<impl IntoApiResponse, Error> {
    let user_id = Uuid::parse_str(&claims.sub)?;
    let pool = db();

    let verification_request = HandleVerificationRequest::get_by_id(request_id, pool)
        .await?
        .ok_or(Error::NotFound)?;

    // Verify user owns this request
    if verification_request.user_id != user_id {
        return Err(Error::unauthorized("Unauthorized"));
    }

    Ok(Json(VerificationStatusResponse {
        status: verification_request.status,
        handle: verification_request.handle,
        challenge: verification_request.challenge,
        expires_at: verification_request.expires_at,
    }))
}

pub async fn poll_verification(
    claims: Claims,
    Path(request_id): Path<Uuid>,
) -> Result<impl IntoApiResponse, Error> {
    let user_id = Uuid::parse_str(&claims.sub)?;
    let verifier = verifier();
    let pool = db();

    let verification_request = HandleVerificationRequest::get_by_id(request_id, pool)
        .await?
        .ok_or(Error::NotFound)?;

    // Verify user owns this request
    if verification_request.user_id != user_id {
        return Err(Error::unauthorized("Unauthorized"));
    }

    // Check if expired
    if verification_request.expires_at < chrono::Utc::now() {
        HandleVerificationRequest::update_status(request_id, "expired", pool).await?;
        return Err(Error::internal(&"Verification request expired".to_string()));
    }

    let delegate_request_id = verification_request
        .request_id
        .ok_or_else(|| Error::internal(&"No delegate request ID found".to_string()))?;

    // Discover handle config to get endpoint
    let config = verifier
        .discover(&verification_request.handle)
        .await
        .map_err(|e| Error::internal(&format!("Failed to discover handle config: {}", e)))?;

    let endpoint = config
        .endpoint
        .ok_or_else(|| Error::internal(&"No delegate endpoint found".to_string()))?;

    // Try to get the token (single attempt)
    let client = DelegateClient::new(&endpoint);
    let token = client
        .poll_for_token(&delegate_request_id, 1, std::time::Duration::from_secs(0))
        .await
        .map_err(|e| Error::internal(&format!("Failed to poll for token: {}", e)))?;

    // Verify the token (token is already a VerificationToken from poll_for_token)
    verifier
        .verify_token(
            &token,
            &verification_request.handle,
            &verification_request.challenge,
            &config.public_key,
        )
        .map_err(|e| Error::internal(&format!("Token verification failed: {}", e)))?;

    // Create verified handle
    let verified_handle = VerifiedHandle::create(
        user_id,
        &verification_request.handle,
        &config.public_key,
        pool,
    )
    .await?;

    // Update request status
    HandleVerificationRequest::update_status(request_id, "completed", pool).await?;

    Ok(Json(verified_handle))
}

pub async fn list_verified_handles(
    claims: Claims,
) -> Result<impl IntoApiResponse, Error> {
    let user_id = Uuid::parse_str(&claims.sub)?;
    let pool = db();
    let handles = VerifiedHandle::get_by_user(user_id, pool).await?;
    Ok(Json(handles))
}

pub async fn list_pending_requests(
    claims: Claims,
) -> Result<impl IntoApiResponse, Error> {
    let user_id = Uuid::parse_str(&claims.sub)?;
    let pool = db();
    let requests = HandleVerificationRequest::get_pending_by_user(user_id, pool).await?;
    Ok(Json(requests))
}

pub async fn delete_verified_handle(
    claims: Claims,
    Path(handle): Path<String>,
) -> Result<impl IntoApiResponse, Error> {
    let user_id = Uuid::parse_str(&claims.sub)?;
    let pool = db();
    VerifiedHandle::delete(user_id, &handle, pool).await?;
    Ok(Json(serde_json::json!({"success": true})))
}

pub fn router() -> ApiRouter {
    ApiRouter::new()
        .api_route(
            "/start",
            post_with(start_verification, |o| {
                o.id("startVerification")
                    .summary("Start handle verification")
                    .description("Initiates the handle verification process")
            }),
        )
        .api_route(
            "/:requestId/complete",
            post_with(complete_verification, |o| {
                o.id("completeVerification")
                    .summary("Complete handle verification")
                    .description("Completes the verification with a signed token")
            }),
        )
        .api_route(
            "/:requestId/status",
            get_with(get_verification_status, |o| {
                o.id("getVerificationStatus")
                    .summary("Get verification status")
                    .description("Gets the current status of a verification request")
            }),
        )
        .api_route(
            "/:requestId/poll",
            post_with(poll_verification, |o| {
                o.id("pollVerification")
                    .summary("Poll for verification completion")
                    .description("Polls the delegate service for verification completion")
            }),
        )
        .api_route(
            "/verified",
            get_with(list_verified_handles, |o| {
                o.id("listVerifiedHandles")
                    .summary("List verified handles")
                    .description("Lists all verified handles for the user")
            }),
        )
        .api_route(
            "/pending",
            get_with(list_pending_requests, |o| {
                o.id("listPendingRequests")
                    .summary("List pending verification requests")
                    .description("Lists all pending verification requests for the user")
            }),
        )
        .api_route(
            "/verified/:handle",
            aide::axum::routing::delete_with(delete_verified_handle, |o| {
                o.id("deleteVerifiedHandle")
                    .summary("Delete verified handle")
                    .description("Removes a verified handle from the user's account")
            }),
        )
}
