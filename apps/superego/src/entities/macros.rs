#[macro_export]
macro_rules! db_enum {
    ($item:item) => {
        #[derive(sqlx::Type, Clone, Debug, Serialize, Deserialize, schemars::JsonSchema)]
        #[serde(rename_all = "SCREAMING_SNAKE_CASE")]
        #[sqlx(rename_all = "SCREAMING_SNAKE_CASE")]
        $item
    };
}

#[macro_export]
macro_rules! model {
    ($item:item) => {
        #[derive(Clone, Debug, Serialize, Deserialize, schemars::JsonSchema)]
        #[serde(rename_all = "camelCase")]
        $item
    };
}

#[macro_export]
macro_rules! entity {
    ($item:item) => {
        #[derive(sqlx::FromRow, Clone, Debug, Serialize, Deserialize, schemars::JsonSchema)]
        #[serde(rename_all = "camelCase")]
        #[sqlx(rename_all = "camelCase")]
        $item
    };
}

#[macro_export]
macro_rules! db_find_by_id {
    ($table: expr) => {
        pub async fn find_by_id<'c, X: sqlx::PgExecutor<'c>>(
            id: uuid::Uuid,
            db: X,
        ) -> Result<Self, crate::error::Error> {
            sqlx::query_as(&format!(
                r##"
                SELECT * FROM "{}" WHERE "id" = $1
                "##,
                $table
            ))
            .bind(&id)
            .fetch_optional(db)
            .await?
            .ok_or(crate::error::Error::NotFound)
        }
    };
}

#[macro_export]
macro_rules! db_list_where {
    ($table: expr, $func_name: ident, $col: expr, $par: ident, $col_ty: ty) => {
        pub async fn $func_name<'c, X: sqlx::PgExecutor<'c>>(
            $par: $col_ty,
            db: X,
        ) -> Result<Vec<Self>, crate::error::Error> {
            let res = sqlx::query_as(&format!(
                r##"
                SELECT * FROM "{}" WHERE "{}" = $1
                "##,
                $table, $col
            ))
            .bind($par)
            .fetch_all(db)
            .await?;
            Ok(res)
        }
    };
}

#[macro_export]
macro_rules! db_entity_delete {
    ($table: expr) => {
        pub async fn delete<'c, X: sqlx::PgExecutor<'c>>(
            &self,
            db: X,
        ) -> Result<(), crate::error::Error> {
            sqlx::query(&format!(
                r##"
                DELETE FROM "{}" WHERE "id" = $1
                "##,
                $table
            ))
            .bind(&self.id)
            .execute(db)
            .await?;
            Ok(())
        }
    };
}
