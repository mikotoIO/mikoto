use schemars::JsonSchema;

use crate::functions::jwt::Claims;

#[derive(Deserialize, JsonSchema)]
#[serde(rename_all = "camelCase")]
pub struct CreateBotPayload {
    pub name: String,
}

// FIXME: the API keys should be hashed as well
pub async fn create_bot(account: Claims) {
    
}
