use std::sync::OnceLock;

#[derive(Deserialize, Debug)]
pub struct Env {
    pub database_url: String,
    pub issuer: String,
    pub port: u16,
    pub secret: String,
    pub captcha: String,
    pub captcha_secret: Option<String>,
}

static ENV: OnceLock<Env> = OnceLock::new();

pub fn env() -> &'static Env {
    ENV.get_or_init(|| {
        dotenv::dotenv().ok();
        envy::from_env().unwrap_or_else(|err| panic!("{:#?}", err))
    })
}
