mod codegen;
mod generate_http;
mod generate_types;
mod generate_ws;
mod naming;
mod parse;
mod schema;

use std::path::Path;

fn main() {
    let manifest_dir = std::env::var("CARGO_MANIFEST_DIR").unwrap_or_else(|_| ".".to_string());
    let root = Path::new(&manifest_dir).join("../..");
    let api_path = root.join("apps/superego/api.json");
    let output_path = root.join("crates/mikoto-client/src/generated.rs");

    eprintln!("Reading API spec from: {}", api_path.display());
    let api_json = std::fs::read_to_string(&api_path)
        .unwrap_or_else(|e| panic!("Failed to read {}: {}", api_path.display(), e));

    let api: parse::OpenApi = serde_json::from_str(&api_json)
        .unwrap_or_else(|e| panic!("Failed to parse API spec: {}", e));

    eprintln!(
        "Parsed {} schemas, {} paths",
        api.components.schemas.len(),
        api.paths.len()
    );

    let output = codegen::generate(&api);

    if let Some(parent) = output_path.parent() {
        std::fs::create_dir_all(parent).ok();
    }

    std::fs::write(&output_path, &output)
        .unwrap_or_else(|e| panic!("Failed to write {}: {}", output_path.display(), e));

    eprintln!("Generated: {}", output_path.display());
}
