use std::time::Duration;

use log::info;
use sqlx::PgPool;
use tokio::{sync::OnceCell, time::timeout};

use crate::{env::env, error::Error};

static DB: OnceCell<PgPool> = OnceCell::const_new();

pub async fn init() -> Result<&'static PgPool, Error> {
    DB.get_or_try_init(|| async {
        let pool = timeout(
            Duration::from_secs(15),
            sqlx::PgPool::connect(&env().database_url_superego),
        )
        .await
        .unwrap()
        .unwrap();

        sqlx::migrate!().run(&pool).await.unwrap();
        Ok(pool)
    })
    .await
}

pub fn db() -> &'static PgPool {
    DB.get().expect("Database not initialized")
}
