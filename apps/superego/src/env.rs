use std::sync::OnceLock;

#[derive(Deserialize, Debug)]
pub struct Env {
    pub database_url: String,
    pub redis_url: String,
    pub issuer: String,
    pub port: u16,

    // JWT
    pub secret: String,

    // Captchas
    pub captcha: String, // either "disabled" or "hcaptcha"
    pub captcha_url: Option<String>,
    pub captcha_secret: Option<String>,

    pub web_url: String,
    pub smtp_sender: Option<String>,
    pub smtp_url: Option<String>,

    pub livekit_server: Option<String>,
    pub livekit_key: Option<String>,
    pub livekit_secret: Option<String>,
}

static ENV: OnceLock<Env> = OnceLock::new();

pub fn env() -> &'static Env {
    ENV.get_or_init(|| {
        dotenv::dotenv().ok();
        envy::from_env().unwrap_or_else(|err| panic!("{:#?}", err))
    })
}
