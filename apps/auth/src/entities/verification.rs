use sqlx::FromRow;
use uuid::Uuid;

#[derive(FromRow, Serialize)]
#[sqlx(rename_all = "camelCase")]
pub struct Verification {
    pub id: Uuid,
    pub category: String,
    pub token: String,
    pub account_id: Uuid,
    pub code: String,
    pub expires_at: time::OffsetDateTime,
}
