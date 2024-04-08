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

pub async fn route(
    Path((store, path)): Path<(String, String)>,
    params: Query<ServeParams>,
) -> Result<FileResponse, Error> {
    let data = bucket().get_object(format!("/{}/{}", store, path)).await?;

    let resp = match (params.w, params.h) {
        (Some(w), Some(h)) => {
            let image = image::load_from_memory(&data.bytes())?.thumbnail(w, h);
            let mut buf = Vec::new();
            image.write_to(&mut Cursor::new(&mut buf), image::ImageOutputFormat::Png)?;
            FileResponse::new(buf, mime::IMAGE_PNG)
        }
        _ => FileResponse::new(data.bytes().to_vec(), get_content_type(&path)),
    };

    Ok(resp)
}
