use uuid::Uuid;

pub struct User {
    pub id: Uuid,
    pub name: String,
}

pub struct EmailAuth {
    pub user_id: Uuid,

    pub email: String,
    pub passhash: Option<String>, // None, if using a "magic link"
}

pub struct MultiFactor {
    pub user_id: Uuid,

    pub secret: String,
    pub verified: bool,
}

pub struct SocialAuth {
    pub id: Uuid,
    pub user_id: Uuid,

    pub provider: String,
    pub provider_id: String,
}
