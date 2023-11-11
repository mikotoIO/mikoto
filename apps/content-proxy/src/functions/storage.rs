use s3::Bucket;
use std::env;
use url::Url;

lazy_static! {
    pub static ref MINIO: Url =
        Url::parse(&env::var("MINIO").expect("environment variable MINIO is not provided"))
            .unwrap();
    static ref MINIO_REGION: s3::Region = s3::Region::Custom {
        region: "".to_owned(),
        endpoint: MINIO.host_str().unwrap().to_owned(),
    };
    static ref MINIO_CRED: s3::creds::Credentials = s3::creds::Credentials {
        access_key: Some(MINIO.username().to_owned()),
        secret_key: MINIO.password().map(|s| s.to_owned()),
        security_token: None,
        session_token: None,
        expiration: None,
    };
    pub static ref MAIN_BUCKET: Bucket =
        Bucket::new("mikoto", MINIO_REGION.clone(), MINIO_CRED.clone()).unwrap();
}
