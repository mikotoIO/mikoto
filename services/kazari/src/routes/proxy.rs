use std::{io::Cursor, str::FromStr};

use image::ImageOutputFormat;
use reqwest::header::CONTENT_TYPE;
use rocket::http::ContentType;

use crate::util::error::Error;

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
        let img = image::io::Reader::new(Cursor::new(res_data))
            .with_guessed_format()
            .map_err(|_| Error::ImageDecodeError)?
            .decode()
            .map_err(|_| Error::ImageDecodeError)?;

        let img = img.resize(
            w.unwrap_or(img.width()),
            h.unwrap_or(img.height()),
            image::imageops::FilterType::CatmullRom,
        );
        let mut resulting = Cursor::new(Vec::<u8>::new());
        img.write_to(
            &mut resulting,
            match content_type.to_string().as_str() {
                "image/png" => ImageOutputFormat::Png,
                "image/jpeg" => ImageOutputFormat::Jpeg(255),
                _ => ImageOutputFormat::Unsupported("Unsupported encode target".to_owned()),
            },
        )
        .map_err(|_| Error::ImageEncodeError)?;
        resulting.into_inner()
    };

    Ok((content_type, bytevec))
}
