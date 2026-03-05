use std::io::Cursor;

use axum::{
    extract::{Multipart, Path},
    http::HeaderMap,
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

fn verify_upload_auth(headers: &HeaderMap) -> Result<(), Error> {
    let secret = match &env().upload_secret {
        Some(s) => s,
        None => return Ok(()), // No secret configured = auth disabled (dev mode)
    };

    let auth = headers
        .get("authorization")
        .and_then(|v| v.to_str().ok())
        .ok_or(Error::Unauthorized)?;

    let token = auth.strip_prefix("Bearer ").ok_or(Error::Unauthorized)?;

    if token != secret {
        return Err(Error::Unauthorized);
    }

    Ok(())
}

pub async fn route(
    headers: HeaderMap,
    Path(store_name): Path<String>,
    mut form: Multipart,
) -> Result<Json<UploadResponse>, Error> {
    verify_upload_auth(&headers)?;

    log::info!("Upload request received for store: {}", store_name);
    let store = config().stores.get(&store_name).ok_or(Error::NotFound)?;

    log::debug!("Reading first multipart field");
    let file = form
        .next_field()
        .await
        .map_err(|e| {
            let msg = format!("Failed to read multipart field: {:?}", e);
            Error::BadRequest { message: Some(msg) }
        })?
        .ok_or(Error::NotFound)?;

    let content_type = file.content_type().map(|s| s.to_string());

    let mut ext = mime_to_ext(content_type.as_deref().unwrap_or("???"));

    let mut buf = file
        .bytes()
        .await
        .map_err(|e| {
            let msg = format!("Failed to read file bytes: {:?}", e);
            Error::BadRequest { message: Some(msg) }
        })?
        .to_vec();

    if buf.len() > store.max_size {
        return Err(Error::FileTooLarge);
    }

    match store.store_type {
        StoreType::Attachment => {}
        StoreType::Image => {
            // Validate actual image content by attempting to decode
            if image::guess_format(&buf).is_err() {
                return Err(Error::BadRequest {
                    message: Some("File is not a valid image".to_string()),
                });
            }
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
