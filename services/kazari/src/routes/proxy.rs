use std::{io::Cursor, str::FromStr};

use image::ImageOutputFormat;
use reqwest::header::CONTENT_TYPE;
use rocket::http::ContentType;

use crate::util::{error::Error, resize_image};

#[get("/proxy?<url>&<w>&<h>")]
pub async fn proxy(
    url: &str,
    w: Option<u32>,
    h: Option<u32>,
) -> Result<(ContentType, Vec<u8>), Error> {
    let client = reqwest::Client::new();
    let response = client
        .get(reqwest::Url::parse(url).map_err(|_| Error::UrlParseError)?)
        .send()
        .await
        .map_err(|_| Error::UrlParseError)?;

    let headers = response.headers().clone();
    let header = headers
        .get(CONTENT_TYPE)
        .ok_or(Error::ExtensionError)?
        .to_str()
        .map_err(|_| Error::ExtensionError)?;
    let content_type = ContentType::from_str(header).map_err(|_| Error::ExtensionError)?;

    let res_data = response.bytes().await.map_err(|_| Error::UrlParseError)?;

    // image resize
    let bytevec = if w.is_none() && h.is_none() {
        res_data.to_vec()
    } else {
        resize_image(
            res_data,
            w.unwrap_or(256),
            h.unwrap_or(256),
            match content_type.to_string().as_str() {
                "image/png" => ImageOutputFormat::Png,
                "image/jpeg" => ImageOutputFormat::Jpeg(255),
                _ => ImageOutputFormat::Unsupported("Unsupported encode target".to_owned()),
            },
        )?
    };

    Ok((content_type, bytevec))
}
