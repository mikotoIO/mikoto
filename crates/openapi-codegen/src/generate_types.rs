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
