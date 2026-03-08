use heck::ToSnakeCase;

/// Convert an operationId like "account.register" to "account_register"
pub fn operation_to_method(operation_id: &str) -> String {
    operation_id.replace('.', "_").to_snake_case()
}

/// Convert a camelCase field name to snake_case
pub fn field_to_snake(name: &str) -> String {
    name.to_snake_case()
}

/// Convert a path parameter like "botId" to snake_case "bot_id"
pub fn param_to_snake(name: &str) -> String {
    name.to_snake_case()
}

/// Convert a WS event name like "channels.onCreate" to PascalCase variant "ChannelsOnCreate"
pub fn ws_event_to_variant(name: &str) -> String {
    use heck::ToPascalCase;
    name.replace('.', "_").to_pascal_case()
}
