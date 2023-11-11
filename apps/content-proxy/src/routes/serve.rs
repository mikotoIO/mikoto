use std::path::PathBuf;

use crate::{error::Error, functions::storage::MAIN_BUCKET};

#[get("/<store>/<path..>")]
pub async fn serve(store: &str, path: PathBuf) -> Result<String, Error> {
    let path = path.to_str().unwrap();

    let _a = MAIN_BUCKET
        .get_object(format!("/{}/{}", store, path))
        .await
        .map_err(|_| Error::StorageError)?;

    unimplemented!()
}
