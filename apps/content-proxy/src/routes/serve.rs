use std::{io::Cursor, path::PathBuf};

use rocket::{
    http::{ContentType, Header, Status},
    response::Responder,
    Response,
};

use crate::{error::Error, functions::storage::MAIN_BUCKET};

pub struct FileResponse {
    pub data: Vec<u8>,
    pub content_type: ContentType,
}

impl FileResponse {
    pub fn new(data: Vec<u8>, content_type: ContentType) -> Self {
        Self { data, content_type }
    }
}

impl<'r> Responder<'r, 'r> for FileResponse {
    fn respond_to(self, _: &rocket::Request) -> rocket::response::Result<'r> {
        Response::build()
            .header(self.content_type)
            .header(Header::new(
                "Cache-Control",
                "public, max-age=86400, must-revalidate",
            ))
            .sized_body(self.data.len(), Cursor::new(self.data))
            .status(Status::Ok)
            .ok()
    }
}

fn get_content_type(path: &str) -> ContentType {
    let mime = mime_guess::from_path(path)
        .first()
        .unwrap_or(mime::APPLICATION_OCTET_STREAM);
    ContentType::new(mime.type_().to_string(), mime.subtype().to_string())
}

#[get("/<store>/<path..>")]
pub async fn serve(store: &str, path: PathBuf) -> Result<FileResponse, Error> {
    let path = path.to_str().unwrap();

    let data = MAIN_BUCKET
        .get_object(format!("/{}/{}", store, path))
        .await
        .map_err(|_| Error::StorageError)?;

    Ok(FileResponse::new(
        data.bytes().to_vec(),
        get_content_type(path),
    ))
}
