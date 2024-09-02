use schemars::JsonSchema;
use sqlx::prelude::FromRow;
use uuid::Uuid;

#[derive(sqlx::Type, Serialize, Deserialize, JsonSchema)]
#[sqlx(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum SpaceType {
    None,
    Dm,
    Group,
}

#[derive(FromRow, Serialize, JsonSchema)]
#[sqlx(rename_all = "camelCase")]
pub struct Space {
    pub id: Uuid,
    pub name: String,
    pub icon: Option<String>,
    pub owner_id: Option<Uuid>,
    pub space_type: SpaceType,
}
