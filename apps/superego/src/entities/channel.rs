use chrono::NaiveDateTime;
use schemars::JsonSchema;
use uuid::Uuid;

use crate::{db_enum, entity};

db_enum!(
    pub enum ChannelType {
        Text,
        Voice,
        Document,
        Application,
        Thread,
        Category,
    }
);

entity!(
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
);

entity!(
    pub struct Message {
        pub id: Uuid,
        pub channel_id: Uuid,
        pub author_id: Uuid,
        pub timestamp: NaiveDateTime,
        pub edited_timestamp: Option<NaiveDateTime>,
        pub content: String,
    }
);

entity!(
    pub struct Document {
        pub id: Uuid,
        pub channel_id: Uuid,
        pub content: String,
    }
);

#[derive(Serialize, Deserialize, JsonSchema)]
#[serde(rename_all = "camelCase")]
pub struct MessageExt {
    pub base: Message,
}
