use std::io::Cursor;

use axum::{extract::Multipart, Json};
use image::imageops::FilterType;
use nanoid::nanoid;

use crate::{error::Error, services::bucket};

use super::config::Store;

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

/// Reads a multipart form field into a buffer.
/// Returns the buffer, as well as the inferred file extension.
async fn multipart_to_buf(
    mut form: Multipart,
    size_limit: usize,
) -> Result<(Vec<u8>, &'static str), Error> {
    let file = form
        .next_field()
        .await
        .map_err(|_| Error::BadRequest)?
        .ok_or(Error::NotFound)?;

    let ext = mime_to_ext(&file.content_type().unwrap_or(&"???"));
    let buf = file.bytes().await.map_err(|_| Error::BadRequest)?.to_vec();
    if buf.len() > size_limit {
        return Err(Error::FileTooLarge);
    }

    Ok((buf, ext))
}

// not a route: this is a handler
pub async fn upload(
    store: &Store,
    name: &str,
    form: Multipart,
) -> Result<Json<UploadResponse>, Error> {
    let (mut buf, mut ext) = multipart_to_buf(form, store.max_size).await?;

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

    let store_path = format!("{}/{}.{}", name, nanoid!(16), ext);
    bucket().put_object(&store_path, &buf).await?;

    Ok(Json(UploadResponse {
        url: format!("{}/{}", "", &store_path),
    }))
}
