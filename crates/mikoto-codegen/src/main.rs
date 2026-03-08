mod codegen;
mod generate_http;
mod generate_types;
mod generate_ws;
mod naming;
mod parse;
mod schema;

use std::path::PathBuf;

fn main() {
    let args: Vec<String> = std::env::args().collect();
    if args.len() != 3 {
        eprintln!("Usage: {} <input_api.json> <output.rs>", args[0]);
        std::process::exit(1);
    }

    let api_path = PathBuf::from(&args[1]);
    let output_path = PathBuf::from(&args[2]);

    println!("Reading API spec from: {}", api_path.display());
    let api_json = std::fs::read_to_string(&api_path)
        .unwrap_or_else(|e| panic!("Failed to read {}: {}", api_path.display(), e));

    let api: parse::OpenApi = serde_json::from_str(&api_json)
        .unwrap_or_else(|e| panic!("Failed to parse API spec: {}", e));

    println!(
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

    println!("Generated: {}", output_path.display());
}
