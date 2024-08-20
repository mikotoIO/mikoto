use std::sync::OnceLock;

use hcaptcha::{HcaptchaCaptcha, HcaptchaClient, HcaptchaRequest};

use crate::{env::env, error::Error};

pub enum Captcha {
    Disabled,
    Hcaptcha { secret: String },
}

impl Captcha {
    pub fn new() -> Self {
        match env().captcha.as_str() {
            "disabled" => Self::Disabled,
            "hcaptcha" => Self::Hcaptcha {
                secret: env().captcha_secret.clone().unwrap(),
            },
            _ => panic!("Invalid captcha provider"),
        }
    }

    pub async fn validate(&self, captcha: Option<&str>) -> Result<(), Error> {
        match self {
            Self::Disabled => Ok(()),
            Self::Hcaptcha { secret } => {
                let client = HcaptchaClient::new();
                let resp = client
                    .verify_client_response(HcaptchaRequest::new(
                        secret,
                        HcaptchaCaptcha::new(captcha.ok_or(Error::CaptchaFailed)?)?,
                    )?)
                    .await?;
                if !resp.success() {
                    return Err(Error::CaptchaFailed);
                }

                Ok(())
            }
        }
    }
}

static CAPTCHA: OnceLock<Captcha> = OnceLock::new();
pub fn captcha() -> &'static Captcha {
    CAPTCHA.get_or_init(Captcha::new)
}
