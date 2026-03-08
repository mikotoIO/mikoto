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
        self.ref_path
            .as_deref()
            .and_then(|p| p.rsplit('/').next())
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
