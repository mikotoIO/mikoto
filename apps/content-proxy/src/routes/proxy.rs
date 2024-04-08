use std::{sync::OnceLock, time::Duration};

use axum::extract::Query;
use mime::Mime;
use reqwest::header::CONTENT_TYPE;

use crate::{error::Error, functions::file_response::FileResponse};

#[derive(Debug, Deserialize)]
pub struct ProxyParams {
    pub url: String,
}

pub fn client() -> &'static reqwest::Client {
    static CLIENT: OnceLock<reqwest::Client> = OnceLock::new();
    CLIENT.get_or_init(|| {
        reqwest::Client::builder()
            .user_agent("Mozilla/5.0 (compatible; biribiri)")
            .timeout(Duration::from_secs(10))
            .connect_timeout(Duration::from_secs(5))
            .build()
            .expect("Failed to build Reqwest client")
    })
}

const MAX_FILE_SIZE: usize = 10 * 1024 * 1024;

fn get_mime_type(res: &reqwest::Response) -> Result<Mime, Error> {
    let content_type = res
        .headers()
        .get(CONTENT_TYPE)
        .ok_or(Error::InvalidContentType)?
        .to_str()
        .map_err(|_| Error::InvalidContentType)?;

    let mime = content_type
        .parse()
        .map_err(|_| Error::InvalidContentType)?;
    Ok(mime)
}

async fn read_buf(res: &mut reqwest::Response) -> Result<Vec<u8>, Error> {
    let len = res.content_length().unwrap_or(0) as usize;
    if len > MAX_FILE_SIZE {
        return Err(Error::FileTooLarge);
    }
    let mut buf = Vec::with_capacity(len);
    while let Some(chunk) = res.chunk().await? {
        if (buf.len() + chunk.len()) > MAX_FILE_SIZE {
            return Err(Error::FileTooLarge);
        }
        buf.extend_from_slice(&chunk);
    }
    Ok(buf)
}

pub async fn route(params: Query<ProxyParams>) -> Result<FileResponse, Error> {
    let mut res = client().get(&params.url).send().await?;
    if !res.status().is_success() {
        return Err(Error::ProxyError {
            internal: res.status().to_string(),
        });
    }
    let mime = get_mime_type(&res)?;
    match mime.type_() {
        mime::IMAGE => {}
        _ => return Err(Error::InvalidContentType),
    }
    let buf = read_buf(&mut res).await?;

    Ok(FileResponse::new(buf, mime))
}
