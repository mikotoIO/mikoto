use std::io::Cursor;

use axum::extract::{Path, Query};

use crate::{
    error::Error,
    functions::{file_response::FileResponse, mime::get_content_type, storage::bucket},
};

#[derive(Debug, Deserialize)]
pub struct ServeParams {
    pub w: Option<u32>,
    pub h: Option<u32>,
}

const MAX_RESIZE_DIMENSION: u32 = 4096;

pub async fn route(
    Path((store, path)): Path<(String, String)>,
    params: Query<ServeParams>,
) -> Result<FileResponse, Error> {
    // Validate path to prevent traversal attacks
    if path.contains("..") || path.contains("//") || path.starts_with('/') {
        return Err(Error::BadRequest {
            message: Some("Invalid path".to_string()),
        });
    }

    let data = bucket().get_object(format!("/{store}/{path}")).await?;
    if data.status_code() == 404 {
        return Err(Error::NotFound);
    }

    let resp = match (params.w, params.h) {
        (Some(w), Some(h)) => {
            // Clamp resize dimensions to prevent DoS
            let w = w.min(MAX_RESIZE_DIMENSION);
            let h = h.min(MAX_RESIZE_DIMENSION);

            let image = image::load_from_memory(data.bytes())?.thumbnail(w, h);
            let mut buf = Vec::new();
            image.write_to(&mut Cursor::new(&mut buf), image::ImageOutputFormat::Png)?;
            FileResponse::new(buf, mime::IMAGE_PNG)
        }
        _ => FileResponse::new(data.bytes().to_vec(), get_content_type(&path)),
    };

    Ok(resp)
}
