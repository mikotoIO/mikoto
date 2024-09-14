use schemars::JsonSchema;
use uuid::Uuid;

use crate::{db_enum, entity};

use super::Channel;

db_enum!(
    pub enum SpaceType {
        None,
        Dm,
        Group,
    }
);

entity!(
    /// # SpaceDataModel
    pub struct Space {
        pub id: Uuid,
        pub name: String,
        pub icon: Option<String>,
        pub owner_id: Option<Uuid>,
        pub space_type: SpaceType,
    }
);

entity!(
    pub struct SpaceUser {
        pub id: Uuid,
        pub name: String,
        pub space_id: Uuid,
        pub user_id: Uuid,
    }
);

entity!(
    pub struct Role {
        pub id: Uuid,
        pub space_id: Uuid,
        pub name: String,
        pub color: Option<String>,
        pub permissions: String,
        pub position: i32,
    }
);

/// # Space
/// Represents a Mikoto Space.
#[derive(Serialize, Deserialize, JsonSchema)]
#[serde(rename_all = "camelCase")]
pub struct SpaceExt {
    #[serde(flatten)]
    pub base: Space,
    pub roles: Vec<Role>,
    pub channels: Vec<Channel>,
}

#[derive(Serialize, Deserialize, JsonSchema)]
#[serde(rename_all = "camelCase")]
pub struct Member {
    #[serde(flatten)]
    pub base: SpaceUser,
    pub role_ids: Vec<Uuid>,
}
