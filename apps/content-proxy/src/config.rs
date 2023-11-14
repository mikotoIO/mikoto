use std::collections::HashMap;

#[derive(Debug, Deserialize)]
pub struct Config {
    pub stores: HashMap<String, Store>,
}

#[derive(Debug, Deserialize)]
pub struct Store {
    pub restrictions: Vec<Restriction>,
    pub transformations: Vec<Transformation>,
}

#[derive(Debug, Deserialize)]

pub enum Restriction {
    Image,
    FileSize(u64),
}

#[derive(Debug, Deserialize)]

pub enum Transformation {
    ResizeTo(u32, u32),
}

lazy_static! {
    pub static ref BASE_CONFIG: Config = Config {
        stores: hashmap! {
            "avatar".to_string() => Store {
                restrictions: vec![Restriction::Image, Restriction::FileSize(10 * 1024 * 1024)],
                transformations: vec![Transformation::ResizeTo(512, 512)]
            },

            "spaceicon".to_string() => Store {
                restrictions: vec![Restriction::Image, Restriction::FileSize(10 * 1024 * 1024)],
                transformations: vec![Transformation::ResizeTo(512, 512)]
            },
        }
    };
}
