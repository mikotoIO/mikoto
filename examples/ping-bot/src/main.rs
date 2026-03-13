use std::env;

use async_trait::async_trait;
use mikoto_client::{BotClient, Context, EventHandler, MessageExt};
use uuid::Uuid;

struct PingBot;

#[async_trait]
impl EventHandler for PingBot {
    async fn ready(&self, ctx: Context) {
        let user = ctx.cache().current_user().unwrap();
        let spaces = ctx.cache().spaces().len();
        let channels = ctx.cache().channels().len();
        println!("{} is ready! watching {} channels across {} spaces", user.name, channels, spaces);
    }

    async fn message_create(&self, ctx: Context, message: MessageExt) {
        if message.content.trim() == "/ping" {
            match ctx.send_message(message.channel_id, "pong!").await {
                Ok(_) => println!("Replied pong! in channel {}", message.channel_id),
                Err(e) => eprintln!("Failed to send message: {e}"),
            }
        }
    }
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    dotenvy::dotenv().ok();
    tracing_subscriber::fmt::init();

    let base_url = env::var("MIKOTO_API_URL").unwrap_or_else(|_| "http://localhost:3511".into());
    let bot_id: Uuid = env::var("MIKOTO_BOT_ID")
        .expect("MIKOTO_BOT_ID must be set")
        .parse()
        .expect("MIKOTO_BOT_ID must be a valid UUID");
    let bot_token = env::var("MIKOTO_BOT_TOKEN").expect("MIKOTO_BOT_TOKEN must be set");

    let bot = BotClient::builder(base_url, bot_id, bot_token)
        .event_handler(PingBot)
        .build()
        .await?;

    bot.start().await?;
    Ok(())
}
