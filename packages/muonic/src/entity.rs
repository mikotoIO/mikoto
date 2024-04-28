use sqlx::{postgres::PgArguments, query::Query, Postgres};

pub trait Entity {
    fn _entity_metadata() -> &'static Meta;
    fn _bind_fields<'a, 'q>(
        &'a self,
        query: Query<'q, Postgres, PgArguments>,
    ) -> Query<'q, Postgres, PgArguments>;
}

pub struct Meta {
    pub table_name: &'static str,
    pub primary_key: &'static str,
    pub fields: &'static [MetaField],
}

pub struct MetaField {
    pub name: &'static str,
}
