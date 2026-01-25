use std::path::Path;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("Generating OpenAPI schema...");

    let openapi = superego::routes::build_openapi_schema();
    let openapi_json = serde_json::to_string_pretty(&openapi)?;
    std::fs::write(
        Path::new(env!("CARGO_MANIFEST_DIR")).join("api.json"),
        openapi_json,
    )?;

    println!("OpenAPI schema dumped to api.json");
    Ok(())
}
