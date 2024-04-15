use std::sync::OnceLock;

#[derive(Deserialize, Debug)]
pub struct Env {
    pub mediaserver_port: u16,
    pub public_mediaserver_url: String,

    #[serde(default)]
    pub s3_use_ssl: bool,
    pub s3_endpoint: String,
    pub s3_port: Option<String>,
    pub s3_region: Option<String>,
    pub s3_access_key: Option<String>,
    pub s3_secret_key: Option<String>,
    pub s3_bucket: String,
}

static ENV: OnceLock<Env> = OnceLock::new();

pub fn env() -> &'static Env {
    ENV.get_or_init(|| {
        dotenvy::dotenv().ok();
        envy::from_env().unwrap_or_else(|err| panic!("{:#?}", err))
    })
}
