use std::env;

lazy_static! {
    pub static ref PUBLIC_MEDIASERVER_URL: String = env::var("PUBLIC_MEDIASERVER_URL")
        .expect("environment variable PUBLIC_MEDIASERVER_URL is not provided");
}
