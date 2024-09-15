use std::sync::OnceLock;

use hcaptcha::{HcaptchaCaptcha, HcaptchaClient, HcaptchaRequest};

use crate::{env::env, error::Error};

#[async_trait]
pub trait Captcha: Send + Sync {
    async fn validate(&self, captcha: Option<&str>) -> Result<(), Error>;
}

pub struct CaptchaDisabled;

#[async_trait]
impl Captcha for CaptchaDisabled {
    async fn validate(&self, _: Option<&str>) -> Result<(), Error> {
        Ok(())
    }
}

pub struct Hcaptcha {
    pub secret: String,
    pub url: Option<String>,
}

#[async_trait]
impl Captcha for Hcaptcha {
    async fn validate(&self, captcha: Option<&str>) -> Result<(), Error> {
        let client = if let Some(url) = &self.url {
            HcaptchaClient::new_with(url).map_err(|_| Error::InternalServerError {
                message: "Failed to create HCaptcha client from given URL".to_string(),
            })?
        } else {
            HcaptchaClient::new()
        };
        let captcha = captcha.ok_or(Error::CaptchaFailed)?;
        let req = HcaptchaCaptcha::new(captcha)
            .and_then(|captcha| HcaptchaRequest::new(&self.secret, captcha))
            .map_err(|_| Error::CaptchaFailed)?;

        let resp = client
            .verify_client_response(req)
            .await
            .map_err(|_| Error::CaptchaFailed)?;

        if !resp.success() {
            return Err(Error::CaptchaFailed);
        }

        Ok(())
    }
}

static CAPTCHA: OnceLock<Box<dyn Captcha>> = OnceLock::new();
pub fn captcha() -> &'static Box<dyn Captcha> {
    CAPTCHA.get_or_init(|| match env().captcha.as_str() {
        "disabled" => Box::new(CaptchaDisabled),
        "hcaptcha" => Box::new(Hcaptcha {
            secret: env().captcha_secret.clone().unwrap(),
            url: env().captcha_url.clone(),
        }),
        _ => panic!("Invalid captcha provider"),
    })
}
