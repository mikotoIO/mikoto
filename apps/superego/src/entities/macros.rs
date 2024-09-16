#[macro_export]
macro_rules! db_enum {
    ($item:item) => {
        #[derive(sqlx::Type, Clone, Serialize, Deserialize, schemars::JsonSchema)]
        #[serde(rename_all = "SCREAMING_SNAKE_CASE")]
        #[sqlx(rename_all = "SCREAMING_SNAKE_CASE")]
        $item
    };
}

#[macro_export]
macro_rules! model {
    ($item:item) => {
        #[derive(Clone, Serialize, Deserialize, schemars::JsonSchema)]
        #[serde(rename_all = "camelCase")]
        $item
    };
}

#[macro_export]
macro_rules! entity {
    ($item:item) => {
        #[derive(sqlx::FromRow, Clone, Serialize, Deserialize, schemars::JsonSchema)]
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
                stringify!($table)
            ))
            .bind(&id)
            .fetch_optional(db)
            .await?
            .ok_or(crate::error::Error::NotFound)
        }
    };
}
