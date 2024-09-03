use chrono::NaiveDateTime;
use schemars::JsonSchema;
use sqlx::prelude::FromRow;
use uuid::Uuid;

#[derive(sqlx::Type, Serialize, Deserialize, JsonSchema)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
#[sqlx(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum ChannelType {
    Text,
    Voice,
    Document,
    Application,
    Thread,
    Category,
}

#[derive(FromRow, Serialize, JsonSchema)]
#[serde(rename_all = "camelCase")]
#[sqlx(rename_all = "camelCase")]
pub struct Channel {
    pub id: Uuid,
    pub space_id: Uuid,

    pub parent_id: Option<Uuid>,
    pub order: i32,

    pub name: String,
    #[serde(rename = "type")]
    #[sqlx(rename = "type")]
    pub category: ChannelType,
    pub last_updated: NaiveDateTime,
}
