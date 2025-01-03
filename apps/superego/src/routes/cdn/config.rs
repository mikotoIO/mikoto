#[derive(Debug, Deserialize)]
pub enum StoreType {
    #[serde(rename = "attachment")]
    Attachment,
    #[serde(rename = "image")]
    Image,
}

#[derive(Debug, Deserialize)]
pub struct ImageSize {
    pub width: u32,
    pub height: u32,
}

#[derive(Debug, Deserialize)]
pub struct Store {
    pub max_size: usize,
    pub store_type: StoreType,

    // image options
    pub image_resize: Option<ImageSize>,
}
