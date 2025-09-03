use std::{collections::HashMap, sync::OnceLock};

use s3::request::ResponseData;

use crate::{error::Error, functions::storage::bucket};

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
    pub max_size: usize,
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
        let res = bucket().put_object("name".to_string(), &data).await?;
        Ok(res)
    }
}

pub fn config() -> &'static Config {
    static CONFIG: OnceLock<Config> = OnceLock::new();
    CONFIG.get_or_init(|| {
        let config = include_str!("../config.toml");
        toml::from_str(config).unwrap()
    })
}
