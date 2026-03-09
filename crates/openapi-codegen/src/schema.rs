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

#[cfg(test)]
mod tests {
    use super::*;

    fn empty_schema() -> Schema {
        Schema {
            schema_type: None,
            format: None,
            properties: None,
            required: vec![],
            items: None,
            ref_path: None,
            enum_values: None,
            one_of: None,
            any_of: None,
            default: None,
            description: None,
            minimum: None,
        }
    }

    #[test]
    fn test_rust_type_to_code() {
        assert_eq!(RustType::String.to_code(), "String");
        assert_eq!(RustType::Uuid.to_code(), "Uuid");
        assert_eq!(RustType::DateTime.to_code(), "DateTime<Utc>");
        assert_eq!(RustType::Bool.to_code(), "bool");
        assert_eq!(RustType::I32.to_code(), "i32");
        assert_eq!(RustType::I64.to_code(), "i64");
        assert_eq!(RustType::U32.to_code(), "u32");
        assert_eq!(RustType::Unit.to_code(), "()");
        assert_eq!(
            RustType::Vec(Box::new(RustType::String)).to_code(),
            "Vec<String>"
        );
        assert_eq!(
            RustType::Option(Box::new(RustType::Uuid)).to_code(),
            "Option<Uuid>"
        );
        assert_eq!(RustType::Named("Foo".into()).to_code(), "Foo");
    }

    #[test]
    fn test_nested_type_to_code() {
        let t = RustType::Vec(Box::new(RustType::Option(Box::new(RustType::I32))));
        assert_eq!(t.to_code(), "Vec<Option<i32>>");
    }

    #[test]
    fn test_wrap_option_idempotent() {
        let t = RustType::Option(Box::new(RustType::String));
        let wrapped = t.wrap_option();
        assert_eq!(wrapped.to_code(), "Option<String>");
    }

    #[test]
    fn test_wrap_option_wraps_non_option() {
        let t = RustType::I32;
        let wrapped = t.wrap_option();
        assert_eq!(wrapped.to_code(), "Option<i32>");
    }

    #[test]
    fn test_resolve_string() {
        let schema = Schema {
            schema_type: Some(SchemaType::Single("string".into())),
            ..empty_schema()
        };
        assert_eq!(resolve_type(&schema).to_code(), "String");
    }

    #[test]
    fn test_resolve_uuid() {
        let schema = Schema {
            schema_type: Some(SchemaType::Single("string".into())),
            format: Some("uuid".into()),
            ..empty_schema()
        };
        assert_eq!(resolve_type(&schema).to_code(), "Uuid");
    }

    #[test]
    fn test_resolve_datetime() {
        let schema = Schema {
            schema_type: Some(SchemaType::Single("string".into())),
            format: Some("date-time".into()),
            ..empty_schema()
        };
        assert_eq!(resolve_type(&schema).to_code(), "DateTime<Utc>");
    }

    #[test]
    fn test_resolve_integer_formats() {
        let schema_i32 = Schema {
            schema_type: Some(SchemaType::Single("integer".into())),
            ..empty_schema()
        };
        assert_eq!(resolve_type(&schema_i32).to_code(), "i32");

        let schema_i64 = Schema {
            schema_type: Some(SchemaType::Single("integer".into())),
            format: Some("int64".into()),
            ..empty_schema()
        };
        assert_eq!(resolve_type(&schema_i64).to_code(), "i64");

        let schema_u32 = Schema {
            schema_type: Some(SchemaType::Single("integer".into())),
            format: Some("uint32".into()),
            ..empty_schema()
        };
        assert_eq!(resolve_type(&schema_u32).to_code(), "u32");
    }

    #[test]
    fn test_resolve_boolean() {
        let schema = Schema {
            schema_type: Some(SchemaType::Single("boolean".into())),
            ..empty_schema()
        };
        assert_eq!(resolve_type(&schema).to_code(), "bool");
    }

    #[test]
    fn test_resolve_array() {
        let schema = Schema {
            schema_type: Some(SchemaType::Single("array".into())),
            items: Some(Box::new(Schema {
                schema_type: Some(SchemaType::Single("string".into())),
                ..empty_schema()
            })),
            ..empty_schema()
        };
        assert_eq!(resolve_type(&schema).to_code(), "Vec<String>");
    }

    #[test]
    fn test_resolve_ref() {
        let schema = Schema {
            ref_path: Some("#/components/schemas/User".into()),
            ..empty_schema()
        };
        assert_eq!(resolve_type(&schema).to_code(), "User");
    }

    #[test]
    fn test_resolve_ref_timestamp_becomes_datetime() {
        let schema = Schema {
            ref_path: Some("#/components/schemas/Timestamp".into()),
            ..empty_schema()
        };
        assert_eq!(resolve_type(&schema).to_code(), "DateTime<Utc>");
    }

    #[test]
    fn test_resolve_nullable_via_type_array() {
        let schema = Schema {
            schema_type: Some(SchemaType::Array(vec!["string".into(), "null".into()])),
            ..empty_schema()
        };
        assert_eq!(resolve_type(&schema).to_code(), "Option<String>");
    }

    #[test]
    fn test_resolve_nullable_via_any_of() {
        let schema = Schema {
            any_of: Some(vec![
                Schema {
                    ref_path: Some("#/components/schemas/User".into()),
                    ..empty_schema()
                },
                Schema {
                    schema_type: Some(SchemaType::Single("null".into())),
                    ..empty_schema()
                },
            ]),
            ..empty_schema()
        };
        assert_eq!(resolve_type(&schema).to_code(), "Option<User>");
    }

    #[test]
    fn test_resolve_nullable_any_of_reversed() {
        let schema = Schema {
            any_of: Some(vec![
                Schema {
                    schema_type: Some(SchemaType::Single("null".into())),
                    ..empty_schema()
                },
                Schema {
                    ref_path: Some("#/components/schemas/Channel".into()),
                    ..empty_schema()
                },
            ]),
            ..empty_schema()
        };
        assert_eq!(resolve_type(&schema).to_code(), "Option<Channel>");
    }

    #[test]
    fn test_resolve_null_type() {
        let schema = Schema {
            schema_type: Some(SchemaType::Single("null".into())),
            ..empty_schema()
        };
        assert_eq!(resolve_type(&schema).to_code(), "()");
    }

    #[test]
    fn test_resolve_no_type_fallback() {
        let schema = empty_schema();
        assert_eq!(resolve_type(&schema).to_code(), "String");
    }
}
