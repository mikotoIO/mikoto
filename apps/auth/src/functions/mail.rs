use handlebars::Handlebars;
use lettre::{AsyncTransport, Tokio1Executor};
use serde::Serialize;

use crate::error::Error;

pub struct MailTemplate {
    pub subject: String,
    pub body: String,
}

pub struct MailSender {
    from: String,
    transport: MailTransport,
}
pub enum MailTransport {
    Dummy,
    Lettre(lettre::AsyncSmtpTransport<Tokio1Executor>),
}

impl MailSender {
    pub async fn send<T>(&self, template: &MailTemplate, to: &str, data: T) -> Result<(), Error>
    where
        T: Serialize,
    {
        match &self.transport {
            MailTransport::Dummy => {}
            MailTransport::Lettre(transport) => {
                let handlebars = Handlebars::new();
                let mail = lettre::Message::builder()
                    .from(self.from.parse()?)
                    .to(to.parse()?)
                    .subject(handlebars.render_template(&template.subject, &data)?)
                    .body(handlebars.render_template(&template.body, &data)?)
                    .unwrap();

                let mail = mail.into();
                transport.send(mail).await.map_err(|_| Error::MailError)?;
            }
        }
        Ok(())
    }
}
