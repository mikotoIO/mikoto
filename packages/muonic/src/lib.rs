pub mod entity;

pub struct Muonic<'a> {
    db: &'a sqlx::PgPool,
}

impl<'a> Muonic<'a> {
    pub fn new(db: &'a sqlx::PgPool) -> Self {
        Self { db }
    }

    pub async fn insert<T: entity::Entity>(&self, entity: &T) -> Result<(), sqlx::Error> {
        let meta = T::_entity_metadata();
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

        entity
            ._bind_fields(sqlx::query(&query))
            .execute(self.db)
            .await?;

        Ok(())
    }
}
