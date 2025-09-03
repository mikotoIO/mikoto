use dotenvy::dotenv;
use sqlx::{
    migrate::MigrateDatabase,
    postgres::{PgPool, Postgres},
};
use std::{env, path::Path, process::Command};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    dotenv().ok();

    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");

    // Check if database exists, create if it doesn't
    if !Postgres::database_exists(&database_url).await? {
        println!("Database does not exist, creating...");
        Postgres::create_database(&database_url).await?;
        println!("Database created successfully!");
    }

    let pool = PgPool::connect(&database_url).await?;

    println!("Running migrations...");
    sqlx::migrate!("./migrations").run(&pool).await?;
    println!("Migrations completed successfully!");

    // Dump schema to schema.sql
    println!("Dumping database schema...");
    let output = Command::new("docker")
        .args([
            "exec",
            "mikoto-postgres-1", // TODO: add a better check for the database container instead of trying to get it from docker-compose
            "pg_dump",
            "-d",
            "mikoto",
            "--schema-only",
        ])
        .output()?;

    if output.status.success() {
        std::fs::write(
            Path::new(env!("CARGO_MANIFEST_DIR")).join("./schema.sql"),
            output.stdout,
        )?;
        println!("Schema dumped to schema.sql");
    } else {
        eprintln!(
            "Failed to dump schema: {}",
            String::from_utf8_lossy(&output.stderr)
        );
    }

    pool.close().await;
    Ok(())
}
