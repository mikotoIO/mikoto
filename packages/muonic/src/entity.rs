use sqlx::{postgres::PgArguments, query::QueryAs, Postgres};

pub trait Entity {
    fn _entity_metadata() -> &'static Meta;
    fn _bind_fields<'a, 'q, O>(
        &'a self,
        query: QueryAs<'q, Postgres, O, PgArguments>,
    ) -> QueryAs<'q, Postgres, O, PgArguments>;
    fn _bind_fields_partial<'a, 'q, 's, O>(
        &'a self,
        query: QueryAs<'q, Postgres, O, PgArguments>,
        fields: Vec<&'s str>,
    ) -> QueryAs<'q, Postgres, O, PgArguments>;
}

pub struct Meta {
    pub table_name: &'static str,
    pub primary_key: &'static str,
    pub fields: &'static [MetaField],
}

pub struct MetaField {
    pub name: &'static str,
}
