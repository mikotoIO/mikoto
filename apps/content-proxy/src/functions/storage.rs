use s3::Bucket;

use std::sync::OnceLock;

use crate::env::env;

pub fn bucket() -> &'static Bucket {
    static BUCKET: OnceLock<Bucket> = OnceLock::new();
    let env = env();

    BUCKET.get_or_init(|| {
        let protocol = if env.s3_use_ssl { "https" } else { "http" };
        let port = match &env.s3_port {
            Some(x) => format!(":{x}"),
            None => "".to_owned(),
        };

        let region = s3::Region::Custom {
            region: env.s3_region.clone().unwrap_or("".to_string()),
            endpoint: format!("{}://{}{}", protocol, &env.s3_endpoint, port),
        };

        let credentials = s3::creds::Credentials {
            access_key: env.s3_access_key.clone(),
            secret_key: env.s3_secret_key.clone(),
            security_token: None,
            session_token: None,
            expiration: None,
        };

        Bucket::new(&env.s3_bucket, region, credentials)
            .expect("Failed to create bucket")
            .with_path_style()
    })
}
