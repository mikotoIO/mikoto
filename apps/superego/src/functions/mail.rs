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
                    .from(self.from.parse().map_err(|e| Error::MailError {
                        message: format!("invalid 'from' address: {e}"),
                    })?)
                    .to(to.parse().map_err(|e| Error::MailError {
                        message: format!("invalid 'to' address: {e}"),
                    })?)
                    .subject(
                        handlebars
                            .render_template(template.subject, &data)
                            .map_err(|e| Error::MailError {
                                message: format!("failed to render subject: {e}"),
                            })?,
                    )
                    .body(
                        handlebars
                            .render_template(template.body, &data)
                            .map_err(|e| Error::MailError {
                                message: format!("failed to render body: {e}"),
                            })?,
                    )
                    .map_err(|e| Error::MailError {
                        message: format!("failed to build message: {e}"),
                    })?;

                transport.send(mail).await.map_err(|e| Error::MailError {
                    message: format!("failed to send mail: {e}"),
                })?;
            }
        }
        Ok(())
    }

    pub fn from_env() -> Self {
        if let Some(smtp) = &env().smtp {
            MailSender {
                from: smtp.sender.clone(),
                transport: MailTransport::Smtp(
                    AsyncSmtpTransport::<Tokio1Executor>::from_url(&smtp.url)
                        .unwrap()
                        .build(),
                ),
            }
        } else {
            MailSender {
                from: "dummy@mikoto.example".to_string(),
                transport: MailTransport::Dummy,
            }
        }
    }
}

static MAILER: OnceLock<MailSender> = OnceLock::new();
pub fn mailer() -> &'static MailSender {
    MAILER.get_or_init(MailSender::from_env)
}
