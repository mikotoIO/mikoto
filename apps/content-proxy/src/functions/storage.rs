use s3::Bucket;
use std::env;
use url::Url;

lazy_static! {
    pub static ref MAIN_BUCKET: Bucket = {
        let minio =
            Url::parse(&env::var("MINIO").expect("environment variable MINIO is not provided"))
                .unwrap();
        let region = s3::Region::Custom {
            region: "".to_owned(),
            endpoint: minio.origin().unicode_serialization(),
        };

        dbg!(minio.origin().unicode_serialization());

        let credentials = s3::creds::Credentials {
            access_key: Some(minio.username().to_owned()),
            secret_key: minio.password().map(|s| s.to_owned()),
            security_token: None,
            session_token: None,
            expiration: None,
        };

        Bucket::new("mikoto", region.clone(), credentials.clone())
            .unwrap()
            .with_path_style()
    };
}
