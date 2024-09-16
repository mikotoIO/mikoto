// models without backing database tables

use uuid::Uuid;

use crate::model;

model!(
    pub struct ObjectWithId {
        pub id: Uuid,
    }
);

impl ObjectWithId {
    pub fn from_id(id: Uuid) -> Self {
        Self { id }
    }
}
