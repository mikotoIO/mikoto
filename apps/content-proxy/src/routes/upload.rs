use std::io::Cursor;

use rocket::{form::Form, fs::TempFile};
use tokio::io::AsyncBufReadExt;

use crate::{
    config::{StoreType, CONFIG},
    env::PUBLIC_MEDIASERVER_URL,
    error::Error,
    functions::storage::MAIN_BUCKET,
};
use image::io::Reader as ImageReader;
use nanoid::nanoid;
use rocket::serde::json::Json;

#[derive(Debug, Serialize)]
pub struct UploadResponse {
    pub url: String,
}

#[derive(FromForm)]
pub struct Upload<'r> {
    pub file: TempFile<'r>,
}

#[post("/<store>", data = "<data>")]
pub async fn upload(store: &str, data: Form<Upload<'_>>) -> Result<Json<UploadResponse>, Error> {
    let f = &data.file;
    let store_config = CONFIG.get(store).ok_or(Error::NotFound)?;

    // validate file size
    if f.len() > store_config.max_size {
        return Err(Error::FileTooLarge);
    }

    // convert file to buffer
    let mut f = f.open().await.map_err(|_| Error::FileBufferError)?;
    let buf = f.fill_buf().await.map_err(|_| Error::FileBufferError)?;

    let (filename, data) = match store_config.store_type {
        StoreType::Image => {
            // validate if image
            dbg!(&data.file.len());
            let mut image = ImageReader::new(Cursor::new(buf))
                .with_guessed_format()
                .map_err(|_| Error::ImageError {
                    internal: "could not guess image format".to_string(),
                })?
                .decode()?;
            if let Some(resize) = &store_config.image_resize {
                // resize image before upload
                image = image.resize_exact(
                    resize.width,
                    resize.height,
                    image::imageops::FilterType::Lanczos3,
                );
            }
            let mut buf = Vec::new();
            image.write_to(&mut Cursor::new(&mut buf), image::ImageOutputFormat::Png)?;
            (format!("{}.png", nanoid!()), buf)
        }
        _ => todo!(),
    };

    let path = format!("{}/{}", &store, &filename);
    MAIN_BUCKET.put_object(&path, &data).await?;

    Ok(Json(UploadResponse {
        url: format!("{}/{}", PUBLIC_MEDIASERVER_URL.to_string(), &path),
    }))
}
