use indexmap::IndexMap;
use serde::Deserialize;

#[derive(Debug, Deserialize)]
pub struct OpenApi {
    pub paths: IndexMap<String, IndexMap<String, Operation>>,
    pub components: Components,
    #[serde(default)]
    pub websocket: Option<WebSocket>,
}

#[derive(Debug, Deserialize)]
pub struct Components {
    pub schemas: IndexMap<String, Schema>,
}

#[derive(Debug, Deserialize)]
pub struct WebSocket {
    pub commands: IndexMap<String, Ref>,
    pub events: IndexMap<String, Ref>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct Ref {
    #[serde(rename = "$ref")]
    pub ref_path: String,
}

impl Ref {
    pub fn type_name(&self) -> &str {
        self.ref_path.rsplit('/').next().unwrap_or(&self.ref_path)
    }
}

#[derive(Debug, Clone, Deserialize)]
#[serde(untagged)]
pub enum SchemaType {
    Single(String),
    Array(Vec<String>),
}

#[derive(Debug, Clone, Deserialize)]
pub struct Schema {
    #[serde(rename = "type")]
    pub schema_type: Option<SchemaType>,
    pub format: Option<String>,
    pub properties: Option<IndexMap<String, Schema>>,
    #[serde(default)]
    pub required: Vec<String>,
    pub items: Option<Box<Schema>>,
    #[serde(rename = "$ref")]
    pub ref_path: Option<String>,
    #[serde(rename = "enum")]
    pub enum_values: Option<Vec<String>>,
    #[serde(rename = "oneOf")]
    pub one_of: Option<Vec<Schema>>,
    #[serde(rename = "anyOf")]
    pub any_of: Option<Vec<Schema>>,
    #[serde(default)]
    pub default: Option<serde_json::Value>,
    pub description: Option<String>,
    pub minimum: Option<f64>,
}

impl Schema {
    pub fn ref_type_name(&self) -> Option<&str> {
        self.ref_path.as_deref().and_then(|p| p.rsplit('/').next())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_ref_type_name() {
        let r = Ref {
            ref_path: "#/components/schemas/User".into(),
        };
        assert_eq!(r.type_name(), "User");
    }

    #[test]
    fn test_ref_type_name_no_slash() {
        let r = Ref {
            ref_path: "User".into(),
        };
        assert_eq!(r.type_name(), "User");
    }

    #[test]
    fn test_schema_ref_type_name() {
        let s = Schema {
            ref_path: Some("#/components/schemas/Message".into()),
            schema_type: None,
            format: None,
            properties: None,
            required: vec![],
            items: None,
            enum_values: None,
            one_of: None,
            any_of: None,
            default: None,
            description: None,
            minimum: None,
        };
        assert_eq!(s.ref_type_name(), Some("Message"));
    }

    #[test]
    fn test_schema_ref_type_name_none() {
        let s = Schema {
            ref_path: None,
            schema_type: None,
            format: None,
            properties: None,
            required: vec![],
            items: None,
            enum_values: None,
            one_of: None,
            any_of: None,
            default: None,
            description: None,
            minimum: None,
        };
        assert_eq!(s.ref_type_name(), None);
    }

    #[test]
    fn test_schema_type_deserialization_single() {
        let json = r#"{"type": "string"}"#;
        let schema: Schema = serde_json::from_str(json).unwrap();
        assert!(matches!(schema.schema_type, Some(SchemaType::Single(t)) if t == "string"));
    }

    #[test]
    fn test_schema_type_deserialization_array() {
        let json = r#"{"type": ["string", "null"]}"#;
        let schema: Schema = serde_json::from_str(json).unwrap();
        match schema.schema_type {
            Some(SchemaType::Array(types)) => {
                assert_eq!(types, vec!["string", "null"]);
            }
            other => panic!("expected Array, got {:?}", other),
        }
    }

    #[test]
    fn test_schema_deserialization_with_ref() {
        let json = r##"{"$ref": "#/components/schemas/User"}"##;
        let schema: Schema = serde_json::from_str(json).unwrap();
        assert_eq!(schema.ref_type_name(), Some("User"));
    }

    #[test]
    fn test_schema_deserialization_enum() {
        let json = r#"{"type": "string", "enum": ["Text", "Voice", "Document"]}"#;
        let schema: Schema = serde_json::from_str(json).unwrap();
        assert_eq!(
            schema.enum_values,
            Some(vec![
                "Text".to_string(),
                "Voice".to_string(),
                "Document".to_string()
            ])
        );
    }

    #[test]
    fn test_operation_deserialization() {
        let json = r##"{
            "operationId": "spaces.list",
            "parameters": [],
            "responses": {
                "200": {
                    "content": {
                        "application/json": {
                            "schema": {"type": "array", "items": {"$ref": "#/components/schemas/Space"}}
                        }
                    }
                }
            }
        }"##;
        let op: Operation = serde_json::from_str(json).unwrap();
        assert_eq!(op.operation_id, Some("spaces.list".into()));
        assert!(op.parameters.is_empty());
        assert!(op.responses.is_some());
    }

    #[test]
    fn test_openapi_deserialization_minimal() {
        let json = r##"{
            "paths": {
                "/api/spaces": {
                    "get": {
                        "operationId": "spaces.list",
                        "responses": {}
                    }
                }
            },
            "components": {
                "schemas": {
                    "Space": {
                        "type": "object",
                        "properties": {
                            "id": {"type": "string", "format": "uuid"},
                            "name": {"type": "string"}
                        },
                        "required": ["id", "name"]
                    }
                }
            }
        }"##;
        let api: OpenApi = serde_json::from_str(json).unwrap();
        assert_eq!(api.paths.len(), 1);
        assert_eq!(api.components.schemas.len(), 1);
        assert!(api.websocket.is_none());
    }
}

#[derive(Debug, Deserialize)]
pub struct Operation {
    #[serde(rename = "operationId")]
    pub operation_id: Option<String>,
    #[serde(default)]
    pub parameters: Vec<Parameter>,
    #[serde(rename = "requestBody")]
    pub request_body: Option<RequestBody>,
    pub responses: Option<IndexMap<String, Response>>,
    #[serde(default)]
    pub tags: Vec<String>,
    pub summary: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct Parameter {
    pub name: String,
    #[serde(rename = "in")]
    pub location: String,
    pub schema: Schema,
    #[serde(default)]
    pub required: bool,
}

#[derive(Debug, Deserialize)]
pub struct RequestBody {
    pub content: IndexMap<String, MediaType>,
}

#[derive(Debug, Deserialize)]
pub struct MediaType {
    pub schema: Schema,
}

#[derive(Debug, Deserialize)]
pub struct Response {
    pub content: Option<IndexMap<String, MediaType>>,
}
