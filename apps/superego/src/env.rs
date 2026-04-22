use std::sync::OnceLock;

#[derive(Deserialize, Debug)]
pub struct Env {
    pub mikoto_env: MikotoMode,

    pub database_url: String,
    pub redis_url: String,
    pub issuer: String,
    pub server_port: u16,
    pub automigrate: Option<bool>,

    // JWT
    pub secret: String,

    pub web_url: String,

    pub s3: S3Env,
    pub smtp: Option<SmtpEnv>,
    pub livekit: Option<LivekitEnv>,
    pub handle: HandleEnv,
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
pub struct S3Env {
    pub access_key: Option<String>,
    pub secret_key: Option<String>,
    pub region: Option<String>,
    pub endpoint: String,
    pub bucket: String,
    pub use_ssl: bool,
    pub port: Option<u16>,
}

#[derive(Deserialize, Debug)]
pub struct HandleEnv {
    /// Domain for default handles (e.g., "mikoto.io" -> handles like "hayley.mikoto.io")
    pub domain: String,
    /// Ed25519 private key (base64 encoded) for signing attestations
    pub private_key: Option<String>,
    /// Ed25519 public key (base64 encoded) for verifying attestations
    pub public_key: Option<String>,
}

#[derive(Deserialize, Debug, Eq, PartialEq)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum MikotoMode {
    Dev,
    Test,
    Production,
}

impl Env {
    pub fn print_env_info(&self) {
        if self.smtp.is_none() {
            warn!("SMTP server not configured. Please enable it for production use.");
        }
        if self.livekit.is_none() {
            warn!("LiveKit server not configured. Please enable it for production use.");
        }
    }
}

static ENV: OnceLock<Env> = OnceLock::new();

pub fn env() -> &'static Env {
    ENV.get_or_init(|| {
        dotenvy::dotenv().ok();
        serde_env::from_env().unwrap_or_else(|err| panic!("{err:#?}"))
    })
}
