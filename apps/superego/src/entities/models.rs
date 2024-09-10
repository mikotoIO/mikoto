// models without backing database tables

use uuid::Uuid;

use crate::model;

model!(
    pub struct ObjectWithId {
        pub id: Uuid,
    }
);
