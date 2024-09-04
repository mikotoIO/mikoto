use uuid::Uuid;

use crate::{db_enum, entity};

db_enum!(
    pub enum UserCategory {
        Bot,
        Unverified,
    }
);

entity!(
    pub struct User {
        id: Uuid,
        name: String,
        avatar: Option<String>,
        description: Option<String>,
        category: Option<UserCategory>,
    }
);
