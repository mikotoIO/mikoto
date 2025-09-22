use std::{error::Error, process::Command};

use crate::env::{env, MikotoMode};

pub fn dump() -> Result<(), Box<dyn Error>> {
    let env = env();
    if env.mikoto_env == MikotoMode::Dev {
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
        // dump OpenAPI to openapi.json
        info!("Dumping OpenAPI schema...");

        // Build the OpenAPI schema by creating and extracting from the router
        let openapi = crate::routes::build_openapi_schema();
        let openapi_json = serde_json::to_string_pretty(&openapi)?;
        std::fs::write("api.json", openapi_json)?;
        info!("OpenAPI schema dumped to api.json");
    }

    Ok(())
}
