use axum::extract::Path;

use crate::functions::file_response::FileResponse;

pub async fn route(Path(id): Path<String>) -> FileResponse {
    let png = mikoto_avatars::generate_png(&id);
    FileResponse::new(png, mime::IMAGE_PNG)
}
