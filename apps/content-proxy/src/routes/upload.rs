use crate::{
    config::CONFIG,
    error::Error,
    functions::storage::{self, MAIN_BUCKET},
};
use rocket::{http::ContentType, Data};
use rocket_multipart_form_data::{MultipartFormData, MultipartFormDataOptions};

#[post("/<store>", data = "<data>")]
pub async fn upload(
    content_type: &ContentType,
    store: String,
    data: Data<'_>,
) -> Result<(), Error> {
    let options = MultipartFormDataOptions::default();
    let mut form_data = MultipartFormData::parse(content_type, data, options)
        .await
        .map_err(|_| Error::BadRequest)?;

    let file = form_data
        .raw
        .remove("key")
        .ok_or(Error::BadRequest)?
        .remove(0);

    let store_config = CONFIG.get(&store).unwrap();

    let res = MAIN_BUCKET
        .put_object(format!("{}", &store), &file.raw)
        .await?;

    todo!()
}
