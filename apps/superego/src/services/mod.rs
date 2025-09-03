use std::sync::OnceLock;

use s3::Bucket;

use crate::env::env;

static BUCKET: OnceLock<Bucket> = OnceLock::new();

pub fn bucket() -> &'static Bucket {
    let env = &env().s3;

    BUCKET.get_or_init(|| {
        let protocol = if env.use_ssl { "https" } else { "http" };
        let port = match &env.port {
            Some(x) => format!(":{x}"),
            None => "".to_owned(),
        };

        let region = s3::Region::Custom {
            region: env.region.clone().unwrap_or("".to_string()),
            endpoint: format!("{}://{}{}", protocol, &env.endpoint, port),
        };

        let credentials = s3::creds::Credentials {
            access_key: env.access_key.clone(),
            secret_key: env.secret_key.clone(),
            security_token: None,
            session_token: None,
            expiration: None,
        };

        Bucket::new(&env.bucket, region, credentials)
            .expect("Failed to create bucket")
            .with_path_style()
    })
}
