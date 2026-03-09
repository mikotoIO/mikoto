use std::collections::HashMap;
use std::env;

use mikoto_client::generated::{BotLoginPayload, MessageSendPayload, WsEvent};
use mikoto_client::MikotoClient;
use uuid::Uuid;

#[tokio::main]
async fn main() {
    dotenvy::dotenv().ok();

    let base_url = env::var("MIKOTO_API_URL").unwrap_or_else(|_| "http://localhost:3511".into());
    let bot_id: Uuid = env::var("MIKOTO_BOT_ID")
        .expect("MIKOTO_BOT_ID must be set")
        .parse()
        .expect("MIKOTO_BOT_ID must be a valid UUID");
    let bot_token = env::var("MIKOTO_BOT_TOKEN").expect("MIKOTO_BOT_TOKEN must be set");

    // Login as bot
    let unauthenticated = MikotoClient::new(&base_url, "");
    let token_pair = unauthenticated
        .api()
        .bots_login(&BotLoginPayload {
            bot_id,
            token: bot_token,
        })
        .await
        .expect("Failed to login as bot");

    println!("Logged in successfully");

    let client = MikotoClient::new(&base_url, &token_pair.access_token);

    // Build channel_id -> space_id mapping
    let mut channel_to_space: HashMap<Uuid, Uuid> = HashMap::new();
    let spaces = client
        .api()
        .spaces_list()
        .await
        .expect("Failed to list spaces");

    for space in &spaces {
        for channel in &space.channels {
            channel_to_space.insert(channel.id, space.id);
        }
    }

    println!(
        "Watching {} channels across {} spaces",
        channel_to_space.len(),
        spaces.len()
    );

    // Connect to WebSocket
    let mut ws = client
        .connect_ws()
        .await
        .expect("Failed to connect to WebSocket");

    println!("Connected to WebSocket, listening for /ping...");

    loop {
        match ws.recv().await {
            Ok(Some(WsEvent::MessagesOnCreate(message))) => {
                if message.content.trim() == "/ping" {
                    let Some(&space_id) = channel_to_space.get(&message.channel_id) else {
                        eprintln!("Unknown channel {}, skipping", message.channel_id);
                        continue;
                    };

                    match client
                        .api()
                        .messages_create(
                            space_id,
                            message.channel_id,
                            &MessageSendPayload {
                                content: "pong!".into(),
                                attachments: None,
                            },
                        )
                        .await
                    {
                        Ok(_) => println!("Replied pong! in channel {}", message.channel_id),
                        Err(e) => eprintln!("Failed to send message: {e}"),
                    }
                }
            }
            Ok(Some(_)) => {} // ignore other events
            Ok(None) => {
                println!("WebSocket closed");
                break;
            }
            Err(e) => {
                // The "ready" event and other unknown ops will cause deserialization errors.
                // This is expected — just continue listening.
                let msg = e.to_string();
                if msg.contains("unknown variant") {
                    continue;
                }
                eprintln!("WebSocket error: {e}");
                break;
            }
        }
    }
}
