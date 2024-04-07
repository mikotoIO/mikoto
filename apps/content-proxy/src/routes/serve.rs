use std::io::Cursor;

use axum::{
    extract::{Path, Query},
    http::{header, HeaderMap, StatusCode},
    response::{IntoResponse, Response},
};

use crate::{
    error::Error,
    functions::{mime::get_content_type, storage::bucket},
};

pub struct FileResponse {
    pub data: Vec<u8>,
    pub content_type: String,
}

impl IntoResponse for FileResponse {
    fn into_response(self) -> Response {
        let mut headers = HeaderMap::new();
        headers.insert(
            "Cache-Control",
            "public, max-age=31536000, must-revalidate".parse().unwrap(),
        );
        headers.insert(header::CONTENT_TYPE, self.content_type.parse().unwrap());
        (StatusCode::OK, headers, self.data).into_response()
    }
}

impl FileResponse {
    pub fn new(data: Vec<u8>, content_type: String) -> Self {
        Self { data, content_type }
    }
}

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
            FileResponse::new(buf, "image/png".to_owned())
        }
        _ => FileResponse::new(data.bytes().to_vec(), get_content_type(&path)),
    };

    Ok(resp)
}
