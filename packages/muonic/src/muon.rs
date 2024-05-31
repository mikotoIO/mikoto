use std::marker::PhantomData;

use sea_query::{
    Asterisk, Expr, Iden, Order, PostgresQueryBuilder, Query, SelectStatement, SimpleExpr,
};
use sea_query_binder::{SqlxBinder, SqlxValues};
use sqlx::{postgres::PgRow, FromRow, PgExecutor};

use crate::entity::Entity;

pub struct Name(pub String);

impl Iden for Name {
    fn unquoted(&self, s: &mut dyn std::fmt::Write) {
        write!(s, "{}", self.0).unwrap();
    }
}

pub fn col(name: &str) -> Expr {
    Expr::col(Name(name.to_string()))
}

pub async fn insert<'c, X: PgExecutor<'c>, E: Entity>(
    db: X,
    entity: &E,
) -> Result<(), sqlx::Error> {
    let meta = E::_entity_metadata();
    let query = format!(
        r#"INSERT INTO "{}" ({}) VALUES ({})"#,
        meta.table_name,
        meta.gen_name_tuple(),
        meta.gen_insert_tuple()
    );
    let _: Vec<()> = entity
        ._bind_fields(sqlx::query_as(&query))
        .fetch_all(db)
        .await?;
    Ok(())
}

pub struct MuonQuery<E> {
    x: PhantomData<E>,
    pub query: SelectStatement,
}

impl<E> MuonQuery<E>
where
    E: Entity + for<'r> FromRow<'r, PgRow> + Send + Unpin,
{
    pub fn where_(&mut self, ex: SimpleExpr) -> &mut Self {
        self.query.and_where(ex);
        self
    }

    pub fn order_by(&mut self, col: &str, ex: Order) -> &mut Self {
        self.query.order_by(Name(col.to_string()), ex);
        self
    }

    pub fn build_query(&self) -> (String, SqlxValues) {
        self.query.build_sqlx(PostgresQueryBuilder)
    }

    pub async fn one<'c, X: PgExecutor<'c>>(&self, db: X) -> Result<Option<E>, sqlx::Error> {
        let (query, values) = self.build_query();
        let entity = sqlx::query_as_with(&query, values)
            .fetch_optional(db)
            .await?;
        Ok(entity)
    }

    pub async fn many<'c, X: PgExecutor<'c>>(&self, db: X) -> Result<Vec<E>, sqlx::Error> {
        let (query, values) = self.build_query();
        let entity = sqlx::query_as_with(&query, values).fetch_all(db).await?;
        Ok(entity)
    }
}

pub fn select<E: Entity>() -> MuonQuery<E> {
    let mut query = Query::select();
    let builder = query
        .column(Asterisk)
        .from(Name(E::_entity_metadata().table_name.to_string()));

    MuonQuery {
        x: PhantomData,
        query: builder.clone(),
    }
}
