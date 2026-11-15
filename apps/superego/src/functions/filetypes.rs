use aide::{
    gen::GenContext,
    openapi::{MediaType, Operation},
    OperationOutput,
};
use axum::response::{IntoResponse, Response};
use indexmap::IndexMap;
use mime::Mime;
use reqwest::{
    header::{self},
    StatusCode,
};

/// A response that represents a file.
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

impl OperationOutput for FileResponse {
    type Inner = Self;

    fn operation_response(
        _ctx: &mut GenContext,
        _operation: &mut Operation,
    ) -> Option<aide::openapi::Response> {
        Some(aide::openapi::Response {
            description: "Image Stream".into(),
            content: IndexMap::from_iter([("image/png".into(), MediaType::default())]),
            ..Default::default()
        })
    }
}

impl FileResponse {
    pub fn new(data: Vec<u8>, content_type: Mime) -> Self {
        Self { data, content_type }
    }
}

pub fn get_content_type(path: &str) -> mime::Mime {
    mime_guess::from_path(path)
        .first()
        .unwrap_or(mime::APPLICATION_OCTET_STREAM)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn guesses_content_type_from_extension() {
        assert_eq!(get_content_type("avatar.png"), mime::IMAGE_PNG);
        assert_eq!(get_content_type("dir/photo.JPG"), mime::IMAGE_JPEG);
        assert_eq!(get_content_type("clip.webm").essence_str(), "video/webm");
    }

    #[test]
    fn unknown_types_are_octet_stream() {
        assert_eq!(get_content_type("noext"), mime::APPLICATION_OCTET_STREAM);
        assert_eq!(
            get_content_type("file.zzzunknown"),
            mime::APPLICATION_OCTET_STREAM
        );
    }

    #[test]
    fn file_response_sets_headers() {
        let res = FileResponse::new(vec![1, 2, 3], mime::IMAGE_PNG).into_response();
        assert_eq!(res.status(), StatusCode::OK);
        assert_eq!(res.headers()[header::CONTENT_TYPE], "image/png");
        assert!(res.headers()[header::CACHE_CONTROL]
            .to_str()
            .unwrap()
            .contains("max-age=31536000"));
    }
}
