//! Database seeding utility for development testing.
//!
//! Creates placeholder data including:
//! - Test users with accounts
//! - A sample space with channels
//! - Sample messages
//! - Roles
//!
//! Run with: `cargo run --bin seed`

use chrono::TimeDelta;
use dotenvy::dotenv;
use sqlx::PgPool;
use superego::{
    entities::{Account, Channel, ChannelType, Message, Role, SpaceUser},
    error::Error as SuperegoError,
    functions::time::Timestamp,
};
use uuid::Uuid;

const TEST_PASSWORD: &str = "password";

struct TestUser {
    id: Uuid,
    name: &'static str,
    email: &'static str,
}

const TEST_USERS: &[TestUser] = &[
    TestUser {
        id: Uuid::from_u128(0x10000000_0000_0000_0000_000000000001),
        name: "Hayley",
        email: "hayley@example.com",
    },
    TestUser {
        id: Uuid::from_u128(0x00000000_0000_0000_0000_000000000001),
        name: "Alice",
        email: "alice@example.com",
    },
    TestUser {
        id: Uuid::from_u128(0x00000000_0000_0000_0000_000000000002),
        name: "Bob",
        email: "bob@example.com",
    },
    TestUser {
        id: Uuid::from_u128(0x00000000_0000_0000_0000_000000000003),
        name: "Charlie",
        email: "charlie@example.com",
    },
    TestUser {
        id: Uuid::from_u128(0x00000000_0000_0000_0000_000000000004),
        name: "Diana",
        email: "diana@example.com",
    },
];

const TEST_SPACE_ID: Uuid = Uuid::from_u128(0x00000000_0000_0000_0000_000000000100);
const GENERAL_CHANNEL_ID: Uuid = Uuid::from_u128(0x00000000_0000_0000_0000_000000000201);
const RANDOM_CHANNEL_ID: Uuid = Uuid::from_u128(0x00000000_0000_0000_0000_000000000202);
const VOICE_CHANNEL_ID: Uuid = Uuid::from_u128(0x00000000_0000_0000_0000_000000000203);
const WIKI_CHANNEL_ID: Uuid = Uuid::from_u128(0x00000000_0000_0000_0000_000000000204);

const SAMPLE_MESSAGES: &[(&'static str, usize)] = &[
    ("Hello everyone! Welcome to the test community.", 0),
    ("Hey Alice! Thanks for setting this up.", 1),
    ("This is a great place to test features.", 2),
    ("I agree! The real-time messaging works really well.", 3),
    ("Has anyone tried the voice chat yet?", 0),
    ("Not yet, but I'm excited to try it!", 1),
    ("The wiki feature is pretty cool too.", 2),
    ("We should document our testing process there.", 3),
    ("Good idea! I'll start a page.", 0),
    ("Let me know if you need any help.", 1),
];

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    dotenv().ok();
    pretty_env_logger::init();

    let database_url = std::env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    let pool = PgPool::connect(&database_url).await?;

    println!("🌱 Starting database seed...\n");

    // Check if already seeded
    let existing_user: Option<(Uuid,)> = sqlx::query_as(r#"SELECT id FROM "User" WHERE id = $1"#)
        .bind(TEST_USERS[0].id)
        .fetch_optional(&pool)
        .await?;

    if existing_user.is_some() {
        println!("⚠️  Database already seeded. Skipping...");
        println!("   To re-seed, delete existing test data first.");
        return Ok(());
    }

    // Create test users
    println!("Creating test users...");
    for user in TEST_USERS {
        create_user_with_account(&pool, user).await?;
        println!("  ✓ Created user: {} ({})", user.name, user.email);
    }

    // Create test space
    println!("\nCreating test space...");
    create_space(&pool).await?;
    println!("  ✓ Created space: Test Community");

    // Create channels
    println!("\nCreating channels...");
    create_channels(&pool).await?;

    // Add members to space
    println!("\nAdding members to space...");
    for user in TEST_USERS {
        add_member_to_space(&pool, user.id).await?;
        println!("  ✓ Added {} to space", user.name);
    }

    // Create roles
    println!("\nCreating roles...");
    create_roles(&pool).await?;

    // Create sample messages
    println!("\nCreating sample messages...");
    create_messages(&pool).await?;
    println!("  ✓ Created {} messages", SAMPLE_MESSAGES.len());

    println!("\n✨ Database seeding complete!");
    println!("\n📝 Test credentials:");
    println!("   Email: alice@example.com");
    println!("   Password: {}", TEST_PASSWORD);

    pool.close().await;
    Ok(())
}

async fn create_user_with_account(pool: &PgPool, user: &TestUser) -> Result<(), sqlx::Error> {
    let passhash =
        bcrypt::hash(TEST_PASSWORD, bcrypt::DEFAULT_COST).expect("Failed to hash password");

    let account = Account {
        id: user.id,
        email: user.email.to_string(),
        passhash,
    };

    account
        .create_with_user(user.name, pool)
        .await
        .map_err(|e| match e {
            SuperegoError::DatabaseError(e) => e,
            _ => sqlx::Error::Protocol("Unexpected error".to_string()),
        })?;

    Ok(())
}

async fn create_space(pool: &PgPool) -> Result<(), sqlx::Error> {
    // Create space directly without the default channel/role (we'll create our own)
    sqlx::query(
        r#"
        INSERT INTO "Space" ("id", "name", "icon", "ownerId", "type")
        VALUES ($1, $2, NULL, $3, 'NONE')
        "#,
    )
    .bind(TEST_SPACE_ID)
    .bind("Test Community")
    .bind(TEST_USERS[0].id)
    .execute(pool)
    .await?;

    Ok(())
}

async fn create_channels(pool: &PgPool) -> Result<(), sqlx::Error> {
    let channels = [
        (GENERAL_CHANNEL_ID, "general", ChannelType::Text, 0),
        (RANDOM_CHANNEL_ID, "random", ChannelType::Text, 1),
        (VOICE_CHANNEL_ID, "Voice Chat", ChannelType::Voice, 2),
        (WIKI_CHANNEL_ID, "Wiki", ChannelType::Document, 3),
    ];

    for (id, name, channel_type, order) in channels {
        let channel = Channel {
            id,
            space_id: TEST_SPACE_ID,
            parent_id: None,
            order,
            name: name.to_string(),
            category: channel_type,
            last_updated: Some(Timestamp::now()),
        };
        channel.create(pool).await.map_err(|e| match e {
            SuperegoError::DatabaseError(e) => e,
            _ => sqlx::Error::Protocol("Unexpected error".to_string()),
        })?;
        println!("  ✓ Created channel: {}", name);
    }

    Ok(())
}

async fn add_member_to_space(pool: &PgPool, user_id: Uuid) -> Result<(), sqlx::Error> {
    let member = SpaceUser::new(TEST_SPACE_ID, user_id);
    member.create(pool).await.map_err(|e| match e {
        SuperegoError::DatabaseError(e) => e,
        _ => sqlx::Error::Protocol("Unexpected error".to_string()),
    })?;
    Ok(())
}

async fn create_roles(pool: &PgPool) -> Result<(), sqlx::Error> {
    let roles = [
        (Uuid::new_v4(), "@everyone", None, "0", -1),
        (Uuid::new_v4(), "Admin", Some("#e74c3c"), "255", 1),
        (Uuid::new_v4(), "Moderator", Some("#3498db"), "127", 0),
    ];

    for (id, name, color, permissions, position) in roles {
        let role = Role {
            id,
            space_id: TEST_SPACE_ID,
            name: name.to_string(),
            color: color.map(|s| s.to_string()),
            permissions: permissions.to_string(),
            position,
        };
        role.create(pool).await.map_err(|e| match e {
            SuperegoError::DatabaseError(e) => e,
            _ => sqlx::Error::Protocol("Unexpected error".to_string()),
        })?;
        println!("  ✓ Created role: {}", name);
    }

    Ok(())
}

async fn create_messages(pool: &PgPool) -> Result<(), sqlx::Error> {
    // Use negative TimeDelta since Timestamp only supports Add<TimeDelta>, not Sub<TimeDelta>
    let base_time = Timestamp::now() + TimeDelta::hours(-1);

    for (i, (content, user_idx)) in SAMPLE_MESSAGES.iter().enumerate() {
        let message = Message {
            id: Uuid::new_v4(),
            channel_id: GENERAL_CHANNEL_ID,
            author_id: Some(TEST_USERS[*user_idx].id),
            timestamp: base_time + TimeDelta::minutes(i as i64 * 2),
            edited_timestamp: None,
            content: content.to_string(),
        };
        message.create(pool).await.map_err(|e| match e {
            SuperegoError::DatabaseError(e) => e,
            _ => sqlx::Error::Protocol("Unexpected error".to_string()),
        })?;
    }

    Ok(())
}
