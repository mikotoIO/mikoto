use std::sync::OnceLock;

use handlebars::Handlebars;
use lettre::{AsyncSmtpTransport, AsyncTransport, Tokio1Executor};
use serde::Serialize;

use crate::{env::env, error::Error};

pub struct MailTemplate {
    pub subject: &'static str,
    pub body: &'static str,
}

pub struct MailSender {
    from: String,
    transport: MailTransport,
}
pub enum MailTransport {
    Dummy,
    Smtp(lettre::AsyncSmtpTransport<Tokio1Executor>),
}

impl MailSender {
    pub async fn send<T>(&self, template: &MailTemplate, to: &str, data: T) -> Result<(), Error>
    where
        T: Serialize,
    {
        match &self.transport {
            MailTransport::Dummy => {}
            MailTransport::Smtp(transport) => {
                let handlebars = Handlebars::new();
                let mail = lettre::Message::builder()
                    .from(self.from.parse().map_err(|_| Error::MailError)?)
                    .to(to.parse().map_err(|_| Error::MailError)?)
                    .subject(
                        handlebars
                            .render_template(template.subject, &data)
                            .map_err(|_| Error::TemplatingError)?,
                    )
                    .body(
                        handlebars
                            .render_template(template.body, &data)
                            .map_err(|_| Error::TemplatingError)?,
                    )
                    .unwrap();

                let mail = mail.into();
                transport.send(mail).await.map_err(|_| Error::MailError)?;
            }
        }
        Ok(())
    }

    pub fn from_env() -> Self {
        MailSender {
            from: env()
                .smtp_sender
                .as_ref()
                .expect("SMTP_SENDER not set")
                .to_string(),
            transport: match &env().smtp_url {
                None => MailTransport::Dummy,
                Some(url) => MailTransport::Smtp(
                    AsyncSmtpTransport::<Tokio1Executor>::from_url(&url)
                        .unwrap()
                        .build(),
                ),
            },
        }
    }
}

static MAILER: OnceLock<MailSender> = OnceLock::new();
pub fn mailer() -> &'static MailSender {
    MAILER.get_or_init(MailSender::from_env)
}
