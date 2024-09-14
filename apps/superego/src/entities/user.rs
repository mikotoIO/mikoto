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

db_enum!(
    pub enum RelationState {
        None,
        Friend,
        Blocked,
        IncomingRequest,
        OutgoingRequest,
    }
);

entity!(
    pub struct Relationship {
        id: Uuid,
        user_id: Uuid,
        relation_id: Uuid,

        state: RelationState,
        space_id: Option<Uuid>,
    }
);
