use crate::naming::field_to_snake;
use crate::parse::{Schema, SchemaType};
use crate::schema::{resolve_type, RustType};
use indexmap::IndexMap;

pub fn generate_types(schemas: &IndexMap<String, Schema>) -> String {
    let mut out = String::new();

    for (name, schema) in schemas {
        out.push_str(&generate_schema(name, schema));
        out.push('\n');
    }

    out
}

fn generate_schema(name: &str, schema: &Schema) -> String {
    // Type alias: simple type with no properties (e.g. Timestamp = string, format: date-time)
    if is_type_alias(name, schema) {
        let rust_type = resolve_type(schema);
        return format!("pub type {} = {};\n", name, rust_type.to_code());
    }

    // String enum
    if let Some(enum_values) = &schema.enum_values {
        return generate_string_enum(name, enum_values);
    }

    // oneOf → tagged enum (e.g. HandleOwner)
    if let Some(one_of) = &schema.one_of {
        return generate_one_of_enum(name, one_of);
    }

    // Object (with or without properties)
    generate_struct(name, schema)
}

fn is_type_alias(_name: &str, schema: &Schema) -> bool {
    // Simple type with format, no properties, no enum, no oneOf
    // Exclude "object" type — those become empty structs
    schema.properties.is_none()
        && schema.enum_values.is_none()
        && schema.one_of.is_none()
        && schema.schema_type.is_some()
        && schema.ref_path.is_none()
        && !matches!(&schema.schema_type, Some(SchemaType::Single(t)) if t == "object")
}

fn generate_string_enum(name: &str, values: &[String]) -> String {
    let mut out = String::new();
    out.push_str("#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]\n");
    out.push_str(&format!("pub enum {} {{\n", name));
    for val in values {
        let variant = enum_variant_name(val);
        if variant != *val {
            out.push_str(&format!("    #[serde(rename = \"{}\")]\n", val));
        }
        out.push_str(&format!("    {},\n", variant));
    }
    out.push_str("}\n");
    out
}

fn enum_variant_name(val: &str) -> String {
    use heck::ToPascalCase;
    // For values like "TEXT", "VOICE" etc., convert to PascalCase
    val.to_pascal_case()
}

fn generate_one_of_enum(name: &str, variants: &[Schema]) -> String {
    // Check if this is a discriminator-based enum (each variant has a "type" field with enum: ["value"])
    let is_type_tagged = variants.iter().all(|v| {
        v.properties
            .as_ref()
            .and_then(|p| p.get("type"))
            .and_then(|t| t.enum_values.as_ref())
            .map(|e| e.len() == 1)
            .unwrap_or(false)
    });

    if is_type_tagged {
        return generate_internally_tagged_enum(name, variants);
    }

    // Fallback: untagged enum
    let mut out = String::new();
    out.push_str("#[derive(Debug, Clone, Serialize, Deserialize)]\n");
    out.push_str("#[serde(untagged)]\n");
    out.push_str(&format!("pub enum {} {{\n", name));
    for (i, variant) in variants.iter().enumerate() {
        let rust_type = resolve_type(variant);
        out.push_str(&format!("    Variant{}({}),\n", i, rust_type.to_code()));
    }
    out.push_str("}\n");
    out
}

fn generate_internally_tagged_enum(name: &str, variants: &[Schema]) -> String {
    let mut out = String::new();
    out.push_str("#[derive(Debug, Clone, Serialize, Deserialize)]\n");
    out.push_str("#[serde(tag = \"type\")]\n");
    out.push_str(&format!("pub enum {} {{\n", name));

    for variant in variants {
        let props = variant.properties.as_ref().unwrap();
        let type_field = props.get("type").unwrap();
        let tag_value = &type_field.enum_values.as_ref().unwrap()[0];
        let variant_name = enum_variant_name(tag_value);

        // Collect non-type fields
        let other_fields: Vec<_> = props
            .iter()
            .filter(|(k, _)| k.as_str() != "type")
            .collect();

        out.push_str(&format!("    #[serde(rename = \"{}\")]\n", tag_value));
        if other_fields.is_empty() {
            out.push_str(&format!("    {},\n", variant_name));
        } else {
            out.push_str(&format!("    {} {{\n", variant_name));
            let required = &variant.required;
            for (field_name, field_schema) in &other_fields {
                let snake = field_to_snake(field_name);
                let mut rust_type = resolve_type(field_schema);
                if !required.contains(field_name) {
                    rust_type = rust_type.wrap_option();
                }
                if snake != **field_name {
                    out.push_str(&format!("        #[serde(rename = \"{}\")]\n", field_name));
                }
                out.push_str(&format!("        {}: {},\n", snake, rust_type.to_code()));
            }
            out.push_str("    },\n");
        }
    }

    out.push_str("}\n");
    out
}

fn generate_struct(name: &str, schema: &Schema) -> String {
    let mut out = String::new();
    out.push_str("#[derive(Debug, Clone, Serialize, Deserialize)]\n");

    let properties = schema.properties.as_ref();

    if let Some(props) = properties {
        if props.is_empty() {
            // Empty struct like InviteCreatePayload
            out.push_str(&format!("pub struct {} {{}}\n", name));
            return out;
        }

        // Check if all field names are already snake_case — if any are camelCase, add rename_all
        let needs_rename = props.keys().any(|k| field_to_snake(k) != *k);
        if needs_rename {
            out.push_str("#[serde(rename_all = \"camelCase\")]\n");
        }

        out.push_str(&format!("pub struct {} {{\n", name));

        for (field_name, field_schema) in props {
            let snake = field_to_snake(field_name);
            let mut rust_type = resolve_type(field_schema);

            let is_required = schema.required.contains(field_name);
            let is_already_option = matches!(&rust_type, RustType::Option(_));

            if !is_required && !is_already_option {
                rust_type = rust_type.wrap_option();
            }

            // Handle fields named "type" (Rust keyword)
            let rust_field_name = if snake == "type" {
                // With rename_all = "camelCase", serde auto-handles "r#type" -> "type"
                // But since the original field is "type" (not camelCase), we need explicit rename
                if needs_rename {
                    // rename_all handles it since "type" in camelCase is still "type"
                    "r#type".to_string()
                } else {
                    out.push_str(&format!("    #[serde(rename = \"type\")]\n"));
                    "r#type".to_string()
                }
            } else if needs_rename && snake != *field_name {
                // rename_all = "camelCase" handles the standard camelCase → snake_case
                // No extra annotation needed for standard camelCase fields
                snake.clone()
            } else if !needs_rename && snake != *field_name {
                out.push_str(&format!("    #[serde(rename = \"{}\")]\n", field_name));
                snake.clone()
            } else {
                snake.clone()
            };

            // Handle default values and Option fields
            let has_default = field_schema
                .default
                .as_ref()
                .is_some_and(|d| d.is_array());

            if matches!(&rust_type, RustType::Option(_)) && !is_required {
                out.push_str(
                    "    #[serde(default, skip_serializing_if = \"Option::is_none\")]\n",
                );
            } else if has_default {
                out.push_str("    #[serde(default)]\n");
            }

            out.push_str(&format!(
                "    pub {}: {},\n",
                rust_field_name,
                rust_type.to_code()
            ));
        }

        out.push_str("}\n");
    } else {
        // No properties at all
        out.push_str(&format!("pub struct {} {{}}\n", name));
    }

    out
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::parse::SchemaType;

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
    fn test_type_alias() {
        let schema = Schema {
            schema_type: Some(SchemaType::Single("string".into())),
            format: Some("date-time".into()),
            ..empty_schema()
        };
        let output = generate_schema("Timestamp", &schema);
        assert_eq!(output, "pub type Timestamp = DateTime<Utc>;\n");
    }

    #[test]
    fn test_string_enum() {
        let schema = Schema {
            schema_type: Some(SchemaType::Single("string".into())),
            enum_values: Some(vec!["Text".into(), "Voice".into(), "Document".into()]),
            ..empty_schema()
        };
        let output = generate_schema("ChannelType", &schema);
        assert!(output.contains("pub enum ChannelType {"));
        assert!(output.contains("Text,"));
        assert!(output.contains("Voice,"));
        assert!(output.contains("Document,"));
    }

    #[test]
    fn test_empty_struct() {
        let schema = Schema {
            schema_type: Some(SchemaType::Single("object".into())),
            properties: Some(IndexMap::new()),
            ..empty_schema()
        };
        let output = generate_schema("EmptyPayload", &schema);
        assert!(output.contains("pub struct EmptyPayload {}"));
    }

    #[test]
    fn test_struct_with_properties() {
        let mut props = IndexMap::new();
        props.insert(
            "id".into(),
            Schema {
                schema_type: Some(SchemaType::Single("string".into())),
                format: Some("uuid".into()),
                ..empty_schema()
            },
        );
        props.insert(
            "name".into(),
            Schema {
                schema_type: Some(SchemaType::Single("string".into())),
                ..empty_schema()
            },
        );
        let schema = Schema {
            schema_type: Some(SchemaType::Single("object".into())),
            properties: Some(props),
            required: vec!["id".into(), "name".into()],
            ..empty_schema()
        };
        let output = generate_schema("Space", &schema);
        assert!(output.contains("pub struct Space {"));
        assert!(output.contains("pub id: Uuid,"));
        assert!(output.contains("pub name: String,"));
        // snake_case fields = no rename_all needed
        assert!(!output.contains("rename_all"));
    }

    #[test]
    fn test_struct_with_camel_case_adds_rename_all() {
        let mut props = IndexMap::new();
        props.insert(
            "channelId".into(),
            Schema {
                schema_type: Some(SchemaType::Single("string".into())),
                format: Some("uuid".into()),
                ..empty_schema()
            },
        );
        let schema = Schema {
            schema_type: Some(SchemaType::Single("object".into())),
            properties: Some(props),
            required: vec!["channelId".into()],
            ..empty_schema()
        };
        let output = generate_schema("Msg", &schema);
        assert!(output.contains("rename_all = \"camelCase\""));
        assert!(output.contains("pub channel_id: Uuid,"));
    }

    #[test]
    fn test_optional_field() {
        let mut props = IndexMap::new();
        props.insert(
            "bio".into(),
            Schema {
                schema_type: Some(SchemaType::Single("string".into())),
                ..empty_schema()
            },
        );
        let schema = Schema {
            schema_type: Some(SchemaType::Single("object".into())),
            properties: Some(props),
            required: vec![], // bio is not required
            ..empty_schema()
        };
        let output = generate_schema("Profile", &schema);
        assert!(output.contains("pub bio: Option<String>,"));
        assert!(output.contains("skip_serializing_if"));
    }

    #[test]
    fn test_no_properties_generates_empty_struct() {
        let schema = Schema {
            schema_type: Some(SchemaType::Single("object".into())),
            ..empty_schema()
        };
        let output = generate_schema("Empty", &schema);
        assert!(output.contains("pub struct Empty {}"));
    }

    #[test]
    fn test_generate_types_multiple_schemas() {
        let mut schemas = IndexMap::new();
        schemas.insert(
            "Timestamp".into(),
            Schema {
                schema_type: Some(SchemaType::Single("string".into())),
                format: Some("date-time".into()),
                ..empty_schema()
            },
        );
        schemas.insert(
            "ChannelType".into(),
            Schema {
                schema_type: Some(SchemaType::Single("string".into())),
                enum_values: Some(vec!["Text".into(), "Voice".into()]),
                ..empty_schema()
            },
        );
        let output = generate_types(&schemas);
        assert!(output.contains("pub type Timestamp"));
        assert!(output.contains("pub enum ChannelType"));
    }

    #[test]
    fn test_one_of_untagged_enum() {
        let variants = vec![
            Schema {
                ref_path: Some("#/components/schemas/User".into()),
                ..empty_schema()
            },
            Schema {
                ref_path: Some("#/components/schemas/Bot".into()),
                ..empty_schema()
            },
        ];
        let schema = Schema {
            one_of: Some(variants),
            ..empty_schema()
        };
        let output = generate_schema("Owner", &schema);
        assert!(output.contains("#[serde(untagged)]"));
        assert!(output.contains("pub enum Owner {"));
        assert!(output.contains("Variant0(User)"));
        assert!(output.contains("Variant1(Bot)"));
    }

    #[test]
    fn test_one_of_internally_tagged_enum() {
        let mut props0 = IndexMap::new();
        props0.insert(
            "type".into(),
            Schema {
                enum_values: Some(vec!["text".into()]),
                ..empty_schema()
            },
        );
        props0.insert(
            "content".into(),
            Schema {
                schema_type: Some(SchemaType::Single("string".into())),
                ..empty_schema()
            },
        );

        let mut props1 = IndexMap::new();
        props1.insert(
            "type".into(),
            Schema {
                enum_values: Some(vec!["image".into()]),
                ..empty_schema()
            },
        );

        let variants = vec![
            Schema {
                properties: Some(props0),
                required: vec!["type".into(), "content".into()],
                ..empty_schema()
            },
            Schema {
                properties: Some(props1),
                required: vec!["type".into()],
                ..empty_schema()
            },
        ];
        let schema = Schema {
            one_of: Some(variants),
            ..empty_schema()
        };
        let output = generate_schema("Block", &schema);
        assert!(output.contains("#[serde(tag = \"type\")]"));
        assert!(output.contains("pub enum Block {"));
        assert!(output.contains("Text {"));
        assert!(output.contains("content: String,"));
        assert!(output.contains("Image,"));
    }
}
