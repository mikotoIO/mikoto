use std::env;

lazy_static! {
    pub static ref MINIO: String =
        env::var("MINIO").expect("environment variable MINIO is not provided");
    pub static ref PUBLIC_CONTENT_PROXY_URL: String = env::var("PUBLIC_CONTENT_PROXY_URL")
        .expect("environment variable PUBLIC_CONTENT_PROXY_URL is not provided");
}
