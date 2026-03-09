mod codegen;
mod generate_http;
mod generate_types;
mod generate_ws;
mod naming;
mod parse;
mod schema;

use std::path::PathBuf;

use clap::Parser;

/// Generate Rust API client code from an OpenAPI spec.
#[derive(Parser)]
struct Args {
    /// Path to the input OpenAPI JSON file
    input: PathBuf,
    /// Path to the output Rust file
    output: PathBuf,
}

fn main() {
    let args = Args::parse();

    println!("Reading API spec from: {}", args.input.display());
    let api_json = std::fs::read_to_string(&args.input)
        .unwrap_or_else(|e| panic!("Failed to read {}: {}", args.input.display(), e));

    let api: parse::OpenApi = serde_json::from_str(&api_json)
        .unwrap_or_else(|e| panic!("Failed to parse API spec: {}", e));

    println!(
        "Parsed {} schemas, {} paths",
        api.components.schemas.len(),
        api.paths.len()
    );

    let output = codegen::generate(&api);

    if let Some(parent) = args.output.parent() {
        std::fs::create_dir_all(parent).ok();
    }

    std::fs::write(&args.output, &output)
        .unwrap_or_else(|e| panic!("Failed to write {}: {}", args.output.display(), e));

    println!("Generated: {}", args.output.display());
}
