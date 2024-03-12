use s3::Bucket;

use std::env;

lazy_static! {
    pub static ref MAIN_BUCKET: Bucket = {
        let protocol = match env::var("S3_USE_SSL") {
            Ok(x) => if x == "true" { "https" } else { "http" },
            Err(_) => "http",
        };
        let endpoint = env::var("S3_ENDPOINT").expect("S3_ENDPOINT is not provided");
        let port = match env::var("S3_PORT") {
            Ok(x) => format!(":{}", x),
            Err(_) => "".to_owned(),
        };

        let region = s3::Region::Custom {
            region: "".to_owned(),
            endpoint: format!("{}://{}{}", protocol, endpoint, port),
        };

        let credentials = s3::creds::Credentials {
            access_key: Some(env::var("S3_ACCESS_KEY").expect("S3_ACCESS_KEY is not provided")),
            secret_key: env::var("S3_SECRET_KEY").ok(),
            security_token: None,
            session_token: None,
            expiration: None,
        };

        // remove the leading slash
        let bucket_name = env::var("S3_BUCKET").expect("S3_BUCKET is not provided");
        Bucket::new(&bucket_name, region.clone(), credentials.clone())
            .expect("Failed to create bucket")
            .with_path_style()
    };
}
