use std::io::Cursor;

use axum::{
    extract::{Multipart, Path},
    Json,
};
use image::imageops::FilterType;
use nanoid::nanoid;

use crate::{
    config::{config, StoreType},
    env::env,
    error::Error,
    functions::storage::bucket,
};

fn mime_to_ext(mime: &str) -> &'static str {
    match mime {
        "image/jpeg" => "jpg",
        "image/png" => "png",
        "image/gif" => "gif",
        "image/webp" => "webp",
        _ => "bin",
    }
}

#[derive(Debug, Serialize)]
pub struct UploadResponse {
    pub url: String,
}

pub async fn route(
    Path(store_name): Path<String>,
    mut form: Multipart,
) -> Result<Json<UploadResponse>, Error> {
    let store = config().stores.get(&store_name).ok_or(Error::NotFound)?;

    let file = form
        .next_field()
        .await
        .map_err(|_| Error::BadRequest)?
        .ok_or(Error::NotFound)?;

    // TODO: This is very hacky. Allow the user to provide their own file types.
    let mut ext = mime_to_ext(file.content_type().unwrap_or("???"));

    let mut buf = file.bytes().await.map_err(|_| Error::BadRequest)?.to_vec();

    if buf.len() > store.max_size {
        return Err(Error::FileTooLarge);
    }

    match store.store_type {
        StoreType::Attachment => {}
        StoreType::Image => {
            // TODO: validate if actually image
            // should be unnecessary, but just in case
        }
    }

    if let Some(resize) = &store.image_resize {
        let image = image::load_from_memory(&buf)?.resize_to_fill(
            resize.width,
            resize.height,
            FilterType::Lanczos3,
        );
        buf = Vec::new();
        image.write_to(&mut Cursor::new(&mut buf), image::ImageOutputFormat::Png)?;
        ext = "png";
    }

    let store_path = format!("{}/{}.{}", store_name, nanoid!(16), ext);
    bucket().put_object(&store_path, &buf).await?;

    Ok(Json(UploadResponse {
        url: format!("{}/{}", env().public_mediaserver_url, &store_path),
    }))
}
