use sqlx::FromRow;
use uuid::Uuid;

#[derive(FromRow)]
#[sqlx(rename_all = "camelCase")]
pub struct Bot {
    pub id: Uuid,
    pub name: String,
    pub owner_id: Uuid,
}
