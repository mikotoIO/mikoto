use std::collections::HashMap;

use s3::request::ResponseData;

use crate::{
    error::Error,
    functions::storage::{self, MAIN_BUCKET},
};

#[derive(Debug, Deserialize)]
pub struct Config {
    pub stores: HashMap<String, Store>,
}

#[derive(Debug, Deserialize)]
#[serde(tag = "id")]
pub enum Transformation {
    #[serde(rename = "resize")]
    Resize { width: u32, height: u32 },
}

#[derive(Debug, Deserialize)]
pub struct Store {
    pub max_size: Option<u64>,
    pub filetype: Option<String>,
    pub transformations: Vec<Transformation>,
}

impl Store {
    pub async fn upload(data: Vec<u8>) -> Result<ResponseData, Error> {
        let res = MAIN_BUCKET.put_object(format!("{}", "name"), &data).await?;
        Ok(res)
    }
}

lazy_static! {
    pub static ref CONFIG: HashMap<String, Store> = {
        let config = std::fs::read_to_string("config.toml").unwrap();
        toml::from_str(&config).unwrap()
    };
}
