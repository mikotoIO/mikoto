use schemars::JsonSchema;
use sqlx::prelude::FromRow;
use uuid::Uuid;

use super::Channel;

#[derive(sqlx::Type, Serialize, Deserialize, JsonSchema)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
#[sqlx(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum SpaceType {
    None,
    Dm,
    Group,
}

/// # SpaceDataModel
#[derive(FromRow, Serialize, JsonSchema)]
#[serde(rename_all = "camelCase")]
#[sqlx(rename_all = "camelCase")]
pub struct Space {
    pub id: Uuid,
    pub name: String,
    pub icon: Option<String>,
    pub owner_id: Option<Uuid>,
    pub space_type: SpaceType,
}

#[derive(FromRow, Serialize, JsonSchema)]
#[serde(rename_all = "camelCase")]
#[sqlx(rename_all = "camelCase")]
pub struct Role {
    pub id: Uuid,
    pub space_id: Uuid,

    pub name: String,
    pub color: Option<String>,
    pub permissions: String,
    pub position: i32,
}

/// # Space
/// Represents a Mikoto Space.
#[derive(Serialize, JsonSchema)]
#[serde(rename_all = "camelCase")]
pub struct SpaceResponse {
    #[serde(flatten)]
    pub base: Space,
    pub roles: Vec<Role>,
    pub channels: Vec<Channel>,
}
