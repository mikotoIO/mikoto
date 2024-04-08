use axum::response::{IntoResponse, Response};
use mime::Mime;
use reqwest::{
    header::{self},
    StatusCode,
};

pub struct FileResponse {
    pub data: Vec<u8>,
    pub content_type: Mime,
}

impl IntoResponse for FileResponse {
    fn into_response(self) -> Response {
        (
            StatusCode::OK,
            [
                (
                    header::CACHE_CONTROL,
                    "public, max-age=31536000, must-revalidate".to_string(),
                ),
                (header::CONTENT_TYPE, self.content_type.to_string()),
            ],
            self.data,
        )
            .into_response()
    }
}

impl FileResponse {
    pub fn new(data: Vec<u8>, content_type: Mime) -> Self {
        Self { data, content_type }
    }
}
