use std::{process::Command, time::Duration};

use fred::{
    prelude::{ClientLike, RedisClient},
    types::{Builder, RedisConfig},
};
use sqlx::migrate::MigrateDatabase;
use sqlx::{PgPool, Postgres};
use tokio::{sync::OnceCell, time::timeout};

use crate::{
    env::{env, MikotoMode},
    error::Error,
};

static DB: OnceCell<PgPool> = OnceCell::const_new();

pub async fn init() -> Result<&'static PgPool, Error> {
    let env = &env();
    DB.get_or_try_init(|| async {
        if env.automigrate.unwrap_or(false) {
            migrate().await.unwrap();
        }

        let pool = timeout(
            Duration::from_secs(15),
            sqlx::PgPool::connect(&env.database_url),
        )
        .await
        .unwrap()
        .unwrap();
        Ok(pool)
    })
    .await
}

pub fn db() -> &'static PgPool {
    DB.get().expect("Database not initialized")
}

static REDIS: OnceCell<RedisClient> = OnceCell::const_new();

pub async fn init_redis() -> Result<&'static RedisClient, Error> {
    REDIS
        .get_or_try_init(|| async {
            let redis = Builder::from_config(
                RedisConfig::from_url(&env().redis_url).expect("Invalid Redis URL"),
            )
            .build()
            .unwrap();
            redis.init().await.expect("Failed to connect to Redis");
            Ok(redis)
        })
        .await
}

pub fn redis() -> &'static RedisClient {
    REDIS.get().expect("Redis not initialized")
}

async fn migrate() -> Result<(), Box<dyn std::error::Error>> {
    let env = env();

    // Check if database exists, create if it doesn't
    if !Postgres::database_exists(&env.database_url).await? {
        info!("Database does not exist, creating...");
        Postgres::create_database(&env.database_url).await?;
        info!("Database created successfully!");
    }

    let pool = PgPool::connect(&env.database_url).await?;

    info!("Running migrations...");
    sqlx::migrate!("./migrations").run(&pool).await?;
    info!("Migrations completed successfully!");

    pool.close().await;

    if env.mikoto_env == MikotoMode::Dev {
        // Dump schema to schema.sql
        info!("Dumping database schema...");
        let output = Command::new("docker")
            .args(&[
                "exec",
                "mikoto-postgres-1", // TODO: add a better check for the database container instead of trying to get it from docker-compose
                "pg_dump",
                "-d",
                "mikoto",
                "--schema-only",
            ])
            .output()?;

        if output.status.success() {
            std::fs::write("schema.sql", output.stdout)?;
            info!("Schema dumped to schema.sql");
        } else {
            error!(
                "Failed to dump schema: {}",
                String::from_utf8_lossy(&output.stderr)
            );
        }
    }
    Ok(())
}
