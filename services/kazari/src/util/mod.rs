pub mod error;
pub mod resize;
pub mod s3;

use std::io::Cursor;

use bytes::Bytes;
use image::ImageOutputFormat;

use crate::util::error::Error;

pub fn resize_image(
    image: Bytes,
    w: u32,
    h: u32,
    format: ImageOutputFormat,
) -> Result<Vec<u8>, Error> {
    let img = image::io::Reader::new(Cursor::new(image))
        .with_guessed_format()
        .map_err(|_| Error::ImageDecodeError)?
        .decode()
        .map_err(|_| Error::ImageDecodeError)?;

    let img = img.resize(w, h, image::imageops::FilterType::CatmullRom);
    let mut resulting = Cursor::new(Vec::<u8>::new());
    img.write_to(&mut resulting, format)
        .map_err(|_| Error::ImageEncodeError)?;

    Ok(resulting.into_inner())
}
