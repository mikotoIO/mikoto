use std::io::Cursor;

use crate::{
    config::{StoreType, CONFIG},
    env::PUBLIC_MEDIASERVER_URL,
    error::Error,
    functions::storage::MAIN_BUCKET,
};
use nanoid::nanoid;
use rocket::{http::ContentType, serde::json::Json, Data};
use rocket_multipart_form_data::{MultipartFormData, MultipartFormDataOptions};

#[derive(Debug, Serialize)]
pub struct UploadResponse {
    pub url: String,
}

#[post("/<store>", data = "<data>")]
pub async fn upload(
    content_type: &ContentType,
    store: String,
    data: Data<'_>,
) -> Result<Json<UploadResponse>, Error> {
    let options = MultipartFormDataOptions::default();
    let mut form_data = MultipartFormData::parse(content_type, data, options)
        .await
        .map_err(|_| Error::BadRequest)?;

    let f = form_data
        .raw
        .remove(form_data.files.keys().next().ok_or(Error::BadRequest)?)
        .ok_or(Error::BadRequest)?
        .remove(0);
    let store_config = CONFIG.get(&store).ok_or(Error::NotFound)?;

    // validate file size
    if f.raw.len() > store_config.max_size as usize {
        return Err(Error::BadRequest);
    }

    let (filename, data) = match store_config.store_type {
        StoreType::Image => {
            // validate if image
            let mut image = image::load_from_memory(&f.raw)?;
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
