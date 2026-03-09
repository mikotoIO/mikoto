use crate::naming::ws_event_to_variant;
use crate::parse::WebSocket;

pub fn generate_ws(ws: &WebSocket) -> String {
    let mut out = String::new();

    // WsCommand enum
    out.push_str("#[derive(Debug, Clone, Serialize)]\n");
    out.push_str("#[serde(tag = \"op\", content = \"data\")]\n");
    out.push_str("pub enum WsCommand {\n");
    for (op, ref_schema) in &ws.commands {
        let variant = ws_event_to_variant(op);
        let type_name = ref_schema.type_name();
        out.push_str(&format!("    #[serde(rename = \"{}\")]\n", op));
        out.push_str(&format!("    {}({}),\n", variant, type_name));
    }
    out.push_str("}\n\n");

    // WsEvent enum
    out.push_str("#[derive(Debug, Clone, Deserialize)]\n");
    out.push_str("#[serde(tag = \"op\", content = \"data\")]\n");
    out.push_str("pub enum WsEvent {\n");
    for (op, ref_schema) in &ws.events {
        let variant = ws_event_to_variant(op);
        let type_name = ref_schema.type_name();
        out.push_str(&format!("    #[serde(rename = \"{}\")]\n", op));
        out.push_str(&format!("    {}({}),\n", variant, type_name));
    }
    out.push_str("}\n");

    out
}
