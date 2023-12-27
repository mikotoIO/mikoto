use std::collections::HashMap;

use s3::request::ResponseData;

use crate::{error::Error, functions::storage::MAIN_BUCKET};

#[derive(Debug, Deserialize)]
pub struct Config {
    pub stores: HashMap<String, Store>,
}

#[derive(Debug, Deserialize)]
pub enum StoreType {
    #[serde(rename = "attachment")]
    Attachment,
    #[serde(rename = "image")]
    Image,
}

#[derive(Debug, Deserialize)]
pub struct Store {
    pub max_size: u64,
    pub store_type: StoreType,

    // image options
    pub image_resize: Option<Resize>,
}

#[derive(Debug, Deserialize)]
pub struct Resize {
    pub width: u32,
    pub height: u32,
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
