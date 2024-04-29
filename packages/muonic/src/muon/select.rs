use sqlx::{Postgres, QueryBuilder};

use crate::entity::Meta;

pub struct MuonSelect<'a> {
    pub qb: QueryBuilder<'a, Postgres>,
}

impl<'a> MuonSelect<'a> {
    pub fn new(meta: &'static Meta) -> Self {
        MuonSelect {
            qb: QueryBuilder::new(format!(r#"SELECT * FROM "{}""#, meta.table_name)),
        }
    }

    pub fn where_(mut self ) -> Self {
        todo!()
    }
}
