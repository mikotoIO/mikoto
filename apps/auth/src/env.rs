use std::sync::OnceLock;

#[derive(Deserialize, Debug)]
pub struct Env {
    pub database_url_superego: String,
    pub superego_port: u16,
}

static ENV: OnceLock<Env> = OnceLock::new();

pub fn env() -> &'static Env {
    ENV.get_or_init(|| {
        dotenv::dotenv().ok();
        envy::from_env().unwrap_or_else(|err| panic!("{:#?}", err))
    })
}
