use std::sync::OnceLock;

#[derive(Deserialize, Debug)]
pub struct Env {
    pub database_url: String,
    pub redis_url: String,
    pub issuer: String,
    pub port: u16,

    // JWT
    pub secret: String,

    pub web_url: String,

    pub smtp: Option<SmtpEnv>,
    pub captcha: CaptchaEnv,
    pub livekit: Option<LivekitEnv>,
}

#[derive(Deserialize, Debug)]
pub struct SmtpEnv {
    pub sender: String,
    pub url: String,
}

#[derive(Deserialize, Debug)]
pub struct LivekitEnv {
    pub server: String,
    pub key: String,
    pub secret: String,
}

#[derive(Deserialize, Debug)]
pub struct CaptchaEnv {
    pub provider: String,
    pub secret: String,
    pub url: Option<String>,
}

impl Env {
    pub fn print_env_info(&self) {
        if self.smtp.is_none() {
            warn!("SMTP server not configured. Please enable it for production use.");
        }
        info!("Captcha provider: {}", self.captcha.provider);
        if self.livekit.is_none() {
            warn!("LiveKit server not configured. Please enable it for production use.");
        }
    }
}

static ENV: OnceLock<Env> = OnceLock::new();

pub fn env() -> &'static Env {
    ENV.get_or_init(|| {
        dotenvy::dotenv().ok();
        serde_env::from_env().unwrap_or_else(|err| panic!("{:#?}", err))
    })
}
