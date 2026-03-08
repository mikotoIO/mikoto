use crate::parse::{Schema, SchemaType};

/// Represents a resolved Rust type
#[derive(Debug, Clone)]
pub enum RustType {
    String,
    Uuid,
    DateTime,
    Bool,
    I32,
    I64,
    U32,
    Unit,
    Vec(Box<RustType>),
    Option(Box<RustType>),
    Named(String),
}

impl RustType {
    pub fn to_code(&self) -> String {
        match self {
            RustType::String => "String".to_string(),
            RustType::Uuid => "Uuid".to_string(),
            RustType::DateTime => "DateTime<Utc>".to_string(),
            RustType::Bool => "bool".to_string(),
            RustType::I32 => "i32".to_string(),
            RustType::I64 => "i64".to_string(),
            RustType::U32 => "u32".to_string(),
            RustType::Unit => "()".to_string(),
            RustType::Vec(inner) => format!("Vec<{}>", inner.to_code()),
            RustType::Option(inner) => format!("Option<{}>", inner.to_code()),
            RustType::Named(name) => name.clone(),
        }
    }

    pub fn wrap_option(self) -> RustType {
        match self {
            RustType::Option(_) => self,
            other => RustType::Option(Box::new(other)),
        }
    }
}

/// Resolve a JSON Schema to a Rust type
pub fn resolve_type(schema: &Schema) -> RustType {
    // $ref
    if let Some(ref_name) = schema.ref_type_name() {
        // Special-case Timestamp as DateTime alias
        if ref_name == "Timestamp" {
            return RustType::DateTime;
        }
        return RustType::Named(ref_name.to_string());
    }

    // anyOf: [{$ref: Foo}, {type: null}] → Option<Foo>
    if let Some(any_of) = &schema.any_of {
        if any_of.len() == 2 {
            let (ref_schema, null_schema) = (&any_of[0], &any_of[1]);
            if is_null_type(null_schema) {
                return resolve_type(ref_schema).wrap_option();
            }
            if is_null_type(ref_schema) {
                return resolve_type(null_schema).wrap_option();
            }
        }
    }

    // oneOf - not handled as a type resolution (handled as enum generation)

    match &schema.schema_type {
        Some(SchemaType::Array(types)) => {
            // ["string", "null"] → Option<String>, ["array", "null"] → Option<Vec<T>>, etc.
            let non_null: Vec<&String> = types.iter().filter(|t| t.as_str() != "null").collect();
            let has_null = types.iter().any(|t| t.as_str() == "null");
            if non_null.len() == 1 && has_null {
                let inner = resolve_single_type(non_null[0], &schema.format, &schema.items);
                inner.wrap_option()
            } else if non_null.len() == 1 {
                resolve_single_type(non_null[0], &schema.format, &schema.items)
            } else {
                RustType::String // fallback
            }
        }
        Some(SchemaType::Single(t)) => resolve_single_type(t, &schema.format, &schema.items),
        None => {
            // No type specified, might be $ref which we already handled
            RustType::String // fallback
        }
    }
}

fn resolve_single_type(
    type_name: &str,
    format: &Option<String>,
    items: &Option<Box<Schema>>,
) -> RustType {
    match type_name {
        "string" => match format.as_deref() {
            Some("uuid") => RustType::Uuid,
            Some("date-time") => RustType::DateTime,
            _ => RustType::String,
        },
        "integer" => match format.as_deref() {
            Some("int64") => RustType::I64,
            Some("uint32") => RustType::U32,
            _ => RustType::I32,
        },
        "boolean" => RustType::Bool,
        "array" => {
            let inner = items
                .as_ref()
                .map(|i| resolve_type(i))
                .unwrap_or(RustType::String);
            RustType::Vec(Box::new(inner))
        }
        "null" => RustType::Unit,
        _ => RustType::String,
    }
}

fn is_null_type(schema: &Schema) -> bool {
    matches!(&schema.schema_type, Some(SchemaType::Single(t)) if t == "null")
}
