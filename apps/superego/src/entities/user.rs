use std::collections::HashMap;

use uuid::Uuid;

use crate::{db_enum, db_find_by_id, entity, error::Error};

use super::hashmap_by_key;

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

impl User {
    db_find_by_id!("User");

    pub async fn dataload<'c, X: sqlx::PgExecutor<'c>>(
        member_ids: Vec<Uuid>,
        db: X,
    ) -> Result<HashMap<Uuid, Self>, Error> {
        let xs: Vec<Self> = sqlx::query_as(
            r##"
            SELECT * FROM "User" WHERE "id" = ANY($1)
            "##,
        )
        .bind(&member_ids)
        .fetch_all(db)
        .await?;
        Ok(hashmap_by_key(xs, |x| x.id))
    }
}
