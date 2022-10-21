use s3::{Region, creds::Credentials};

// lazy_static s3 client
lazy_static! {
    static ref REGION: Region = Region::Custom {
        region: "".to_string(),
        endpoint: "http://localhost:4566".to_string(),
    };

    static ref CREDENTIALS: Credentials = Credentials {
        access_key: Some("AKIAIOSFODNN7EXAMPLE".to_owned()),
        secret_key: Some("wJalrXUtnFEMIKK7MDENGKKPxRfiCYEXAMPLEKEY".to_owned()),
        expiration: None,
        security_token: None,
        session_token: None,
    };
}