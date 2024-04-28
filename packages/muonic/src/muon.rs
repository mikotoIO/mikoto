use std::marker::PhantomData;

use sqlx::{self, postgres::PgRow, FromRow, PgExecutor};

use crate::entity::Entity;

pub struct Muon<E: Entity> {
    x: PhantomData<E>,
}

pub fn muon<E: Entity>() -> Muon<E> {
    Muon { x: PhantomData }
}

impl<'r, E: Entity + FromRow<'r, PgRow>> Muon<E> {
    // queries

    // mutations
    pub async fn insert<'c, X: PgExecutor<'c>>(
        &self,
        db: X,
        entity: &E,
    ) -> Result<(), sqlx::Error> {
        let meta = E::_entity_metadata();
        let query = format!(
            r#"INSERT INTO "{}" ({}) VALUES ({})"#,
            meta.table_name,
            meta.fields
                .iter()
                .map(|f| f.name)
                .collect::<Vec<_>>()
                .join(", "),
            meta.fields
                .iter()
                .enumerate()
                .map(|(i, _)| format!("${}", i + 1))
                .collect::<Vec<_>>()
                .join(", ")
        );

        entity._bind_fields(sqlx::query(&query)).execute(db).await?;
        Ok(())
    }

    pub async fn update<'c, X: PgExecutor<'c>>(
        &self,
        db: X,
        entity: &E,
        fields: Vec<&str>,
    ) -> Result<(), sqlx::Error> {
        let meta = E::_entity_metadata();
        let query = format!(
            r#"UPDATE "{}" SET {}"#,
            meta.table_name,
            fields
                .iter()
                .enumerate()
                .map(|(i, f)| format!(r#""{}" = ${}"#, f, i + 1))
                .collect::<Vec<_>>()
                .join(", ")
        );

        entity
            ._bind_fields_partial(sqlx::query(&query), fields)
            .execute(db)
            .await?;
        Ok(())
    }
}
