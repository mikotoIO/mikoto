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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_operation_to_method() {
        assert_eq!(operation_to_method("account.register"), "account_register");
        assert_eq!(operation_to_method("spaces.list"), "spaces_list");
        assert_eq!(
            operation_to_method("channels.messages.send"),
            "channels_messages_send"
        );
        assert_eq!(operation_to_method("simpleOp"), "simple_op");
    }

    #[test]
    fn test_field_to_snake() {
        assert_eq!(field_to_snake("channelId"), "channel_id");
        assert_eq!(field_to_snake("id"), "id");
        assert_eq!(field_to_snake("createdAt"), "created_at");
        assert_eq!(field_to_snake("already_snake"), "already_snake");
    }

    #[test]
    fn test_param_to_snake() {
        assert_eq!(param_to_snake("botId"), "bot_id");
        assert_eq!(param_to_snake("spaceId"), "space_id");
        assert_eq!(param_to_snake("simple"), "simple");
    }

    #[test]
    fn test_ws_event_to_variant() {
        assert_eq!(ws_event_to_variant("channels.onCreate"), "ChannelsOnCreate");
        assert_eq!(ws_event_to_variant("messages.onDelete"), "MessagesOnDelete");
        assert_eq!(ws_event_to_variant("typing.start"), "TypingStart");
    }
}
