use dotenvy::dotenv;
use sqlx::{
    migrate::MigrateDatabase,
    postgres::{PgPool, Postgres},
};
use std::env;

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

    pool.close().await;
    Ok(())
}
