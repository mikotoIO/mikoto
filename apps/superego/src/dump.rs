use tokio::{fs, process::Command, try_join};

use crate::{
    env::{env, MikotoMode},
    error::Error,
};

pub async fn dump() -> Result<(), Error> {
    let env = env();
    if env.mikoto_env == MikotoMode::Dev {
        let _ = try_join!(dump_postgres(), dump_api())?;
    }

    Ok(())
}

pub async fn dump_postgres() -> Result<(), Error> {
    // Dump schema to schema.sql
    info!("Dumping database schema...");
    let output = Command::new("docker")
        .args([
            "exec",
            "mikoto-postgres-1", // TODO: add a better check for the database container instead of trying to get it from docker-compose
            "pg_dump",
            "-d",
            "mikoto",
            "--schema-only",
        ])
        .output()
        .await?;

    if output.status.success() {
        fs::write("schema.sql", output.stdout).await?;
        info!("Schema dumped to schema.sql");
    } else {
        error!(
            "Failed to dump schema: {}",
            String::from_utf8_lossy(&output.stderr)
        );
    }
    Ok(())
}

pub async fn dump_api() -> Result<(), Error> {
    // dump OpenAPI to openapi.json
    info!("Dumping OpenAPI schema...");
    let openapi = crate::routes::build_openapi_schema();
    let openapi_json = serde_json::to_string_pretty(&openapi)?;
    fs::write("api.json", openapi_json).await?;
    info!("OpenAPI schema dumped to api.json");
    Ok(())
}
