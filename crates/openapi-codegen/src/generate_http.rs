use crate::naming::{operation_to_method, param_to_snake};
use crate::parse::{OpenApi, Operation};
use crate::schema::{resolve_type, RustType};
use std::collections::HashSet;

struct Endpoint {
    method_name: String,
    http_method: String,
    path: String,
    path_params: Vec<PathParam>,
    query_params: Vec<QueryParam>,
    body_type: Option<String>,
    response_type: RustType,
}

struct PathParam {
    name: String,
    rust_type: RustType,
}

struct QueryParam {
    original_name: String,
    snake_name: String,
    rust_type: RustType,
}

pub fn generate_http(api: &OpenApi) -> String {
    let endpoints = collect_endpoints(api);

    let mut out = String::new();

    out.push_str("pub struct HttpApi<'a> {\n");
    out.push_str("    pub client: &'a reqwest::Client,\n");
    out.push_str("    pub base_url: &'a str,\n");
    out.push_str("    pub token: &'a str,\n");
    out.push_str("}\n\n");

    out.push_str("impl<'a> HttpApi<'a> {\n");
    out.push_str("    fn url(&self, path: &str) -> String {\n");
    out.push_str("        format!(\"{}{}\", self.base_url, path)\n");
    out.push_str("    }\n\n");

    for ep in &endpoints {
        out.push_str(&generate_method(ep));
        out.push('\n');
    }

    out.push_str("}\n");
    out
}

fn collect_endpoints(api: &OpenApi) -> Vec<Endpoint> {
    let mut endpoints = Vec::new();

    for (path, methods) in &api.paths {
        // Extract path parameters from URL template
        let path_param_names = extract_path_params(path);

        for (http_method, operation) in methods {
            let Some(op_id) = &operation.operation_id else {
                continue;
            };

            let method_name = operation_to_method(op_id);
            let response_type = get_response_type(operation);

            let mut path_params: Vec<PathParam> = path_param_names
                .iter()
                .map(|name| PathParam {
                    name: param_to_snake(name),
                    rust_type: guess_path_param_type(name),
                })
                .collect();

            // Override types from explicit parameter definitions
            for p in &operation.parameters {
                if p.location == "path" {
                    let snake = param_to_snake(&p.name);
                    if let Some(pp) = path_params.iter_mut().find(|pp| pp.name == snake) {
                        pp.rust_type = resolve_type(&p.schema);
                    }
                }
            }

            let query_params: Vec<QueryParam> = operation
                .parameters
                .iter()
                .filter(|p| p.location == "query")
                .map(|p| {
                    let mut rust_type = resolve_type(&p.schema);
                    // Query params are always optional unless explicitly required
                    if !matches!(&rust_type, RustType::Option(_)) && !p.required {
                        rust_type = rust_type.wrap_option();
                    }
                    QueryParam {
                        original_name: p.name.clone(),
                        snake_name: param_to_snake(&p.name),
                        rust_type,
                    }
                })
                .collect();

            let body_type = get_body_type(operation);

            endpoints.push(Endpoint {
                method_name,
                http_method: http_method.to_uppercase(),
                path: path.clone(),
                path_params,
                query_params,
                body_type,
                response_type,
            });
        }
    }

    endpoints
}

fn extract_path_params(path: &str) -> Vec<String> {
    let mut params = Vec::new();
    let mut seen = HashSet::new();
    let mut chars = path.chars().peekable();
    while let Some(c) = chars.next() {
        if c == '{' {
            let name: String = chars.by_ref().take_while(|&c| c != '}').collect();
            if seen.insert(name.clone()) {
                params.push(name);
            }
        }
    }
    params
}

fn guess_path_param_type(name: &str) -> RustType {
    // Most path params ending in "Id" are UUIDs
    if name.ends_with("Id") {
        RustType::Uuid
    } else {
        RustType::String
    }
}

fn get_response_type(op: &Operation) -> RustType {
    let Some(responses) = &op.responses else {
        return RustType::Unit;
    };
    let Some(resp) = responses.get("200") else {
        return RustType::Unit;
    };
    let Some(content) = &resp.content else {
        return RustType::Unit;
    };
    let Some(media) = content.get("application/json") else {
        return RustType::Unit;
    };
    resolve_type(&media.schema)
}

fn get_body_type(op: &Operation) -> Option<String> {
    let body = op.request_body.as_ref()?;
    let media = body.content.get("application/json")?;
    let schema = &media.schema;

    if let Some(ref_name) = schema.ref_type_name() {
        return Some(ref_name.to_string());
    }

    None
}

fn generate_method(ep: &Endpoint) -> String {
    let mut out = String::new();
    let mut params = Vec::new();

    // Path parameters
    for pp in &ep.path_params {
        params.push(format!("{}: {}", pp.name, pp.rust_type.to_code()));
    }

    // Query parameters
    for qp in &ep.query_params {
        params.push(format!("{}: {}", qp.snake_name, qp.rust_type.to_code()));
    }

    // Body parameter
    if let Some(body_type) = &ep.body_type {
        params.push(format!("body: &{}", body_type));
    }

    let params_str = if params.is_empty() {
        "&self".to_string()
    } else {
        format!("&self, {}", params.join(", "))
    };

    let return_type = match &ep.response_type {
        RustType::Unit => "Result<(), ClientError>".to_string(),
        other => format!("Result<{}, ClientError>", other.to_code()),
    };

    out.push_str(&format!(
        "    pub async fn {}({}) -> {} {{\n",
        ep.method_name, params_str, return_type
    ));

    // Build path with parameter substitution
    let path_expr = build_path_expr(&ep.path, &ep.path_params);
    out.push_str(&format!("        let path = {};\n", path_expr));

    // Build request
    let req_method = ep.http_method.to_lowercase();
    out.push_str(&format!(
        "        let mut req = self.client.{}(self.url(&path))\n",
        req_method
    ));
    out.push_str("            .bearer_auth(self.token);\n");

    // Add query parameters
    for qp in &ep.query_params {
        if matches!(&qp.rust_type, RustType::Option(_)) {
            out.push_str(&format!(
                "        if let Some(v) = &{} {{ req = req.query(&[(\"{}\", v.to_string())]); }}\n",
                qp.snake_name, qp.original_name
            ));
        } else {
            out.push_str(&format!(
                "        req = req.query(&[(\"{}\", {}.to_string())]);\n",
                qp.original_name, qp.snake_name
            ));
        }
    }

    // Add body
    if ep.body_type.is_some() {
        out.push_str("        req = req.json(body);\n");
    }

    // Send and handle response
    out.push_str("        let resp = req.send().await?.error_for_status()?;\n");

    match &ep.response_type {
        RustType::Unit => {
            out.push_str("        let _ = resp.text().await?;\n");
            out.push_str("        Ok(())\n");
        }
        _ => {
            out.push_str("        Ok(resp.json().await?)\n");
        }
    }

    out.push_str("    }\n");
    out
}

fn build_path_expr(path: &str, params: &[PathParam]) -> String {
    if params.is_empty() {
        return format!("\"{}\".to_string()", path);
    }

    // Convert {paramName} to {} for format!
    let mut format_str = path.to_string();
    let mut format_args = Vec::new();

    for pp in params {
        // Find the original camelCase name in the path
        let camel_pattern = find_param_in_path(path, &pp.name);
        format_str = format_str.replace(&format!("{{{}}}", camel_pattern), "{}");
        format_args.push(pp.name.clone());
    }

    format!(
        "format!(\"{}\", {})",
        format_str,
        format_args.join(", ")
    )
}

fn find_param_in_path(path: &str, snake_name: &str) -> String {
    // Extract all {param} names and find the one matching our snake_case name
    let mut chars = path.chars().peekable();
    while let Some(c) = chars.next() {
        if c == '{' {
            let name: String = chars.by_ref().take_while(|&c| c != '}').collect();
            if param_to_snake(&name) == snake_name {
                return name;
            }
        }
    }
    snake_name.to_string()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_extract_path_params_empty() {
        assert!(extract_path_params("/api/spaces").is_empty());
    }

    #[test]
    fn test_extract_path_params_single() {
        let params = extract_path_params("/api/spaces/{spaceId}");
        assert_eq!(params, vec!["spaceId"]);
    }

    #[test]
    fn test_extract_path_params_multiple() {
        let params = extract_path_params("/api/spaces/{spaceId}/channels/{channelId}");
        assert_eq!(params, vec!["spaceId", "channelId"]);
    }

    #[test]
    fn test_extract_path_params_deduplicates() {
        let params = extract_path_params("/api/{id}/sub/{id}");
        assert_eq!(params, vec!["id"]);
    }

    #[test]
    fn test_guess_path_param_type_uuid() {
        assert!(matches!(guess_path_param_type("spaceId"), RustType::Uuid));
        assert!(matches!(guess_path_param_type("channelId"), RustType::Uuid));
        assert!(matches!(guess_path_param_type("messageId"), RustType::Uuid));
    }

    #[test]
    fn test_guess_path_param_type_string() {
        assert!(matches!(guess_path_param_type("slug"), RustType::String));
        assert!(matches!(guess_path_param_type("name"), RustType::String));
    }

    #[test]
    fn test_build_path_expr_no_params() {
        let result = build_path_expr("/api/spaces", &[]);
        assert_eq!(result, r#""/api/spaces".to_string()"#);
    }

    #[test]
    fn test_build_path_expr_with_params() {
        let params = vec![PathParam {
            name: "space_id".into(),
            rust_type: RustType::Uuid,
        }];
        let result = build_path_expr("/api/spaces/{spaceId}", &params);
        assert_eq!(result, r#"format!("/api/spaces/{}", space_id)"#);
    }

    #[test]
    fn test_build_path_expr_multiple_params() {
        let params = vec![
            PathParam {
                name: "space_id".into(),
                rust_type: RustType::Uuid,
            },
            PathParam {
                name: "channel_id".into(),
                rust_type: RustType::Uuid,
            },
        ];
        let result = build_path_expr("/api/spaces/{spaceId}/channels/{channelId}", &params);
        assert_eq!(
            result,
            r#"format!("/api/spaces/{}/channels/{}", space_id, channel_id)"#
        );
    }

    #[test]
    fn test_find_param_in_path() {
        assert_eq!(
            find_param_in_path("/api/spaces/{spaceId}", "space_id"),
            "spaceId"
        );
    }

    #[test]
    fn test_find_param_in_path_fallback() {
        assert_eq!(
            find_param_in_path("/api/items/{id}", "missing"),
            "missing"
        );
    }

    #[test]
    fn test_generate_http_simple_endpoint() {
        let json = r#"{
            "paths": {
                "/api/spaces": {
                    "get": {
                        "operationId": "spaces.list",
                        "responses": {}
                    }
                }
            },
            "components": { "schemas": {} }
        }"#;
        let api: crate::parse::OpenApi = serde_json::from_str(json).unwrap();
        let output = generate_http(&api);
        assert!(output.contains("pub async fn spaces_list(&self) -> Result<(), ClientError>"));
        assert!(output.contains("self.client.get(self.url(&path))"));
    }
}
