use s3::Bucket;
use url::Url;

use crate::env::MINIO;

lazy_static! {
    pub static ref MAIN_BUCKET: Bucket = {
        let minio =
            Url::parse(&MINIO).unwrap();
        let region = s3::Region::Custom {
            region: "".to_owned(),
            endpoint: minio.origin().unicode_serialization(),
        };

        let credentials = s3::creds::Credentials {
            access_key: Some(minio.username().to_owned()),
            secret_key: minio.password().map(|s| s.to_owned()),
            security_token: None,
            session_token: None,
            expiration: None,
        };

        // remove the leading slash
        let bucket_name = minio.path().strip_prefix("/").expect("The URL path must start with a slash");
        Bucket::new(bucket_name, region.clone(), credentials.clone())
            .expect("Failed to create bucket")
            .with_path_style()
    };
}
