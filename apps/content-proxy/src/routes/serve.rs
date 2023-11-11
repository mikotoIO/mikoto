use std::{io::Cursor, path::PathBuf};

use rocket::{
    http::{ContentType, Status},
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
            .sized_body(self.data.len(), Cursor::new(self.data))
            .status(Status::Ok)
            .ok()
    }
}

#[get("/<store>/<path..>")]
pub async fn serve(store: &str, path: PathBuf) -> Result<FileResponse, Error> {
    let path = path.to_str().unwrap();

    let data = MAIN_BUCKET
        .get_object(format!("/{}/{}", store, path))
        .await
        .map_err(|_| Error::StorageError)?;

    let data = data.bytes().to_vec();

    let mime = mime_guess::from_path(path)
        .first()
        .unwrap_or(mime::APPLICATION_OCTET_STREAM);
    let mime = ContentType::new(mime.type_().to_string(), mime.subtype().to_string());
    Ok(FileResponse::new(data, mime))
}
