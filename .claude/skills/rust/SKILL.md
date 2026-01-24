---
name: rust
description: Contains knowledge on Mikoto usage of Rust. ALWAYS activate before interacting with the backend, or any part of the codebase written in Rust.
---

# Rust Development in Mikoto

## Project Structure

The Rust backend lives in `apps/superego/` (main API) and `apps/content-proxy/` (media proxy).

```
apps/superego/src/
├── entities/            # Database models
├── routes/              # API handlers
├── middlewares/         # Auth, extractors
└── functions/           # Utilities (JWT, permissions, pubsub)
```

## Creating Entities

Use the macros in `src/entities/macros.rs`:

```rust
// Database-backed entity
entity!(
    pub struct Message {
        pub id: Uuid,
        pub channel_id: Uuid,
        pub author_id: Option<Uuid>,
        pub content: String,
        pub timestamp: DateTime<Utc>,
    }
);

// Non-database model (DTOs, payloads)
model!(
    pub struct MessageSendPayload {
        pub content: String,
    }
);

// Database enum
db_enum!(
    #[sqlx(type_name = "\"ChannelType\"")]
    pub enum ChannelType {
        Text,
        Voice,
        Document,
    }
);
```

Use helper macros for common queries:

```rust
impl Message {
    db_find_by_id!("Message");
    db_entity_delete!("Message");
    db_list_where!(Message, list_by_channel, channel_id, channel_id, Uuid);
}
```

## Extended Entities (with Relations)

For entities that need related data:

```rust
pub struct MessageExt {
    #[serde(flatten)]
    pub base: Message,
    pub author: Option<User>,
    pub attachments: Vec<Attachment>,
}

impl MessageExt {
    pub async fn dataload(messages: Vec<Message>, db: &PgPool) -> Result<Vec<Self>> {
        // Batch load relations to avoid N+1 queries
        let author_ids: Vec<Uuid> = messages.iter().filter_map(|m| m.author_id).collect();
        let authors = User::find_by_ids(&author_ids, db).await?;
        // ... map and return
    }

    pub async fn dataload_one(message: Message, db: &PgPool) -> Result<Self> {
        Ok(Self::dataload(vec![message], db).await?.pop().unwrap())
    }
}
```

## Creating Routes

Routes use Axum with aide for OpenAPI documentation.

### Basic Route Handler

```rust
use crate::error::{Error, Result};
use crate::middlewares::auth::Claims;
use axum::extract::{Path, Json};

async fn get_message(
    Path((space_id, channel_id, message_id)): Path<(Uuid, Uuid, Uuid)>,
    claim: Claims,  // Requires authentication
) -> Result<Json<MessageExt>> {
    let message = Message::find_by_id(message_id, db()).await?;
    let message = MessageExt::dataload_one(message, db()).await?;
    Ok(message.into())
}
```

### Registering Routes

In the route module's router function:

```rust
use aide::axum::routing::{get_with, post_with, patch_with, delete_with};

pub fn router() -> AppRouter {
    AppRouter::new()
        .api_route("/", get_with(list, api_docs))
        .api_route("/", post_with(create, api_docs))
        .api_route("/:messageId", get_with(get, api_docs))
        .api_route("/:messageId", patch_with(update, api_docs))
        .api_route("/:messageId", delete_with(delete, api_docs))
}
```

### Using the Load Extractor

For automatic entity loading from path params:

```rust
use crate::middlewares::load::Load;

async fn get_space(Load(space): Load<SpaceExt>) -> Result<Json<SpaceExt>> {
    Ok(space.into())
}
```

## Error Handling

Use the custom Error type from `src/error.rs`:

```rust
use crate::error::{Error, Result};

async fn example() -> Result<Json<Data>> {
    // Use ? to propagate errors
    let data = fetch_data().await?;

    // Create specific errors
    if !authorized {
        return Err(Error::forbidden("You cannot access this resource"));
    }

    // Not found
    let item = Item::find_by_id(id, db()).await?
        .ok_or_else(|| Error::not_found("Item not found"))?;

    Ok(data.into())
}
```

## Database Operations

Always use `db()` for the connection pool:

```rust
use crate::db::db;

// Insert
sqlx::query("INSERT INTO \"Message\" (id, content) VALUES ($1, $2)")
    .bind(id)
    .bind(content)
    .execute(db())
    .await?;

// Query
let messages: Vec<Message> = sqlx::query_as(
    "SELECT * FROM \"Message\" WHERE channel_id = $1 ORDER BY timestamp DESC"
)
    .bind(channel_id)
    .fetch_all(db())
    .await?;
```

## Creating Migrations

```bash
just new-migration <migration_name>
```

This creates a file in `apps/superego/migrations/`. Write SQL directly:

```sql
-- Create new table
CREATE TABLE "Attachment" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES "Message"(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    url TEXT NOT NULL,
    content_type TEXT NOT NULL,
    size INTEGER NOT NULL
);

-- Add column
ALTER TABLE "Message" ADD COLUMN edited_at TIMESTAMPTZ;

-- Create enum
CREATE TYPE "AttachmentType" AS ENUM ('Image', 'Video', 'File');
```

After creating migrations, read `schema.sql` for the current full schema.

## Real-time Events

Emit events via Redis pub/sub:

```rust
use crate::functions::pubsub::emit_event;

// After creating a message
emit_event("messages.onCreate", &message_ext, &format!("space:{}", space_id)).await?;

// After updating
emit_event("messages.onUpdate", &message_ext, &format!("space:{}", space_id)).await?;

// After deleting
emit_event("messages.onDelete", &MessageKey { channel_id, message_id }, &format!("space:{}", space_id)).await?;
```

## WebSocket Handlers

Register WebSocket commands and events in the router:

```rust
.ws_command("typing.start", |data: TypingPayload, state| async move {
    // Handle client command
    Ok(())
})
.ws_event("messages.onCreate", |data: MessageExt, state| async move {
    // Filter/transform for this connection
    Some(data)
})
```

## Permissions

Use the permission functions in `src/functions/permissions.rs`:

```rust
use crate::functions::permissions::{permissions, Permissions};

async fn admin_action(claim: Claims, Load(space): Load<SpaceExt>) -> Result<Json<()>> {
    permissions(&claim, &space, Permissions::ADMIN)?;
    // ... admin-only logic
}
```

## Testing

Write unit tests inline with `#[cfg(test)]`:

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_something() {
        // ...
    }

    #[tokio::test]
    async fn test_async_thing() {
        // ...
    }
}
```

## Key Conventions

- **Table names**: PascalCase with quotes (`"Message"`, `"User"`)
- **JSON fields**: camelCase (handled by serde)
- **Rust fields**: snake_case
- **IDs**: Always UUID
- **Timestamps**: `DateTime<Utc>` with chrono
- **Optionals**: `Option<T>` for nullable fields
