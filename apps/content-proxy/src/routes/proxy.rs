use std::{net::IpAddr, sync::OnceLock, time::Duration};

use axum::extract::Query;
use mime::Mime;
use reqwest::header::CONTENT_TYPE;
use url::Url;

use crate::{error::Error, functions::file_response::FileResponse};

#[derive(Debug, Deserialize)]
pub struct ProxyParams {
    pub url: String,
}

fn is_private_ip(ip: IpAddr) -> bool {
    match ip {
        IpAddr::V4(ipv4) => {
            ipv4.is_loopback()
                || ipv4.is_private()
                || ipv4.is_link_local()
                || ipv4.is_broadcast()
                || ipv4.is_unspecified()
                || ipv4.octets()[0] == 100 && ipv4.octets()[1] >= 64 && ipv4.octets()[1] <= 127 // CGN
                || ipv4.octets()[0] == 169 && ipv4.octets()[1] == 254 // metadata endpoint
        }
        IpAddr::V6(ipv6) => ipv6.is_loopback() || ipv6.is_unspecified(),
    }
}

fn validate_proxy_url(raw_url: &str) -> Result<(), Error> {
    let parsed = Url::parse(raw_url).map_err(|_| Error::BadRequest { message: Some("Invalid URL".to_string()) })?;

    match parsed.scheme() {
        "http" | "https" => {}
        _ => return Err(Error::BadRequest { message: Some("Only HTTP(S) URLs are allowed".to_string()) }),
    }

    let host = parsed.host_str().ok_or(Error::BadRequest { message: Some("URL must have a host".to_string()) })?;

    // Block direct IP addresses that are private
    if let Ok(ip) = host.parse::<IpAddr>() {
        if is_private_ip(ip) {
            return Err(Error::BadRequest { message: Some("Private IP addresses are not allowed".to_string()) });
        }
    }

    // Block common internal hostnames
    let host_lower = host.to_lowercase();
    if host_lower == "localhost"
        || host_lower.ends_with(".local")
        || host_lower.ends_with(".internal")
    {
        return Err(Error::BadRequest { message: Some("Internal hostnames are not allowed".to_string()) });
    }

    Ok(())
}

pub fn client() -> &'static reqwest::Client {
    static CLIENT: OnceLock<reqwest::Client> = OnceLock::new();
    CLIENT.get_or_init(|| {
        reqwest::Client::builder()
            .user_agent("Mozilla/5.0 (compatible; biribiri)")
            .timeout(Duration::from_secs(10))
            .connect_timeout(Duration::from_secs(5))
            .redirect(reqwest::redirect::Policy::limited(3))
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
    validate_proxy_url(&params.url)?;

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
