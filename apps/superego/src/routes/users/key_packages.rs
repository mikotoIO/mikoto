use aide::axum::routing::{delete_with, get_with, post_with};
use axum::{extract::Path, Json};
use schemars::JsonSchema;
use uuid::Uuid;

use crate::{
    db::db,
    entities::{KeyPackage, KeyPackageExt, KeyPackageUploadItem},
    error::Error,
    functions::jwt::Claims,
    routes::{router::AppRouter, ws::state::State},
};

#[derive(Deserialize, JsonSchema)]
#[serde(rename_all = "camelCase")]
pub struct KeyPackageUploadPayload {
    pub packages: Vec<KeyPackageUploadItem>,
}

#[derive(Serialize, JsonSchema)]
#[serde(rename_all = "camelCase")]
pub struct KeyPackageCountResponse {
    pub count: i64,
}

async fn upload(
    claim: Claims,
    Json(body): Json<KeyPackageUploadPayload>,
) -> Result<Json<()>, Error> {
    let user_id: Uuid = claim.sub.parse()?;

    if body.packages.is_empty() {
        return Err(Error::BadRequest);
    }
    if body.packages.len() > 100 {
        return Err(Error::new(
            "TooManyKeyPackages",
            axum::http::StatusCode::BAD_REQUEST,
            "Cannot upload more than 100 KeyPackages at once",
        ));
    }

    KeyPackage::create_batch(user_id, body.packages, db()).await?;
    Ok(().into())
}

async fn count(claim: Claims) -> Result<Json<KeyPackageCountResponse>, Error> {
    let user_id: Uuid = claim.sub.parse()?;
    let count = KeyPackage::count_unconsumed(user_id, db()).await?;
    Ok(Json(KeyPackageCountResponse { count }))
}

async fn fetch(
    _claim: Claims,
    Path(user_id): Path<Uuid>,
) -> Result<Json<KeyPackageExt>, Error> {
    KeyPackage::fetch_one_unconsumed(user_id, db())
        .await?
        .map(|kp| Json(kp.into()))
        .ok_or(Error::new(
            "NoKeyPackages",
            axum::http::StatusCode::NOT_FOUND,
            "User has no available KeyPackages",
        ))
}

async fn fetch_all(
    _claim: Claims,
    Path(user_id): Path<Uuid>,
) -> Result<Json<Vec<KeyPackageExt>>, Error> {
    let kps = KeyPackage::fetch_all_devices(user_id, db()).await?;
    if kps.is_empty() {
        return Err(Error::new(
            "NoKeyPackages",
            axum::http::StatusCode::NOT_FOUND,
            "User has no available KeyPackages",
        ));
    }
    Ok(Json(kps.into_iter().map(Into::into).collect()))
}

async fn revoke(claim: Claims, Path(device_id): Path<Uuid>) -> Result<Json<()>, Error> {
    let user_id: Uuid = claim.sub.parse()?;
    KeyPackage::delete_by_device(user_id, device_id, db()).await?;
    Ok(().into())
}

static TAG: &str = "KeyPackages";

pub fn router() -> AppRouter<State> {
    AppRouter::new()
        .route(
            "/",
            post_with(upload, |o| {
                o.tag(TAG)
                    .id("keyPackages.upload")
                    .summary("Upload KeyPackages")
            }),
        )
        .route(
            "/count",
            get_with(count, |o| {
                o.tag(TAG)
                    .id("keyPackages.count")
                    .summary("Get KeyPackage Count")
            }),
        )
        .route(
            "/:userId",
            get_with(fetch, |o| {
                o.tag(TAG)
                    .id("keyPackages.fetch")
                    .summary("Fetch KeyPackage for User")
            }),
        )
        .route(
            "/:userId/devices",
            get_with(fetch_all, |o| {
                o.tag(TAG)
                    .id("keyPackages.fetchAll")
                    .summary("Fetch KeyPackages for All Devices")
            }),
        )
        .route(
            "/device/:deviceId",
            delete_with(revoke, |o| {
                o.tag(TAG)
                    .id("keyPackages.revoke")
                    .summary("Revoke KeyPackages for Device")
            }),
        )
}
