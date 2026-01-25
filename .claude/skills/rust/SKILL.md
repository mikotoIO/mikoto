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
    permissions(&claim, &space, Permissions::ADMIN)?;`
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

## Best Practices

### Safety

- **Never use `unsafe` Rust** - This codebase has no need for unsafe code. All functionality can be achieved with safe Rust.
- **Never use `.unwrap()` or `.expect()` in production code** - Always use `?` operator or handle errors explicitly. The only exception is in tests or when the value is guaranteed to exist (with a comment explaining why).
- **Avoid `.clone()` unless necessary** - Prefer borrowing. If cloning is needed, consider if the data structure should use `Arc` instead.

### Researching Crates

- **Use WebFetch on docs.rs** to explore crate APIs before using them. Example: `https://docs.rs/axum/latest/axum/`
- **Check crate versions before adding** - Search docs.rs or crates.io to find the latest version before adding to Cargo.toml.
- **Prefer crates already in use** - Check `apps/superego/Cargo.toml` before adding new dependencies. The codebase already includes many utilities.

### Code Quality

- **Run `moon :typecheck` after changes** - This checks both Rust and TypeScript. Always run before committing.
- **Follow clippy suggestions** - Run `moon :lint` and address all warnings. Clippy catches common mistakes and suggests idiomatic Rust.
- **Use existing patterns** - Look at similar code in the codebase before implementing. Follow established patterns for entities, routes, and error handling.

### Database

- **Read `schema.sql` for current schema** - Don't read individual migrations. The schema dump is always up-to-date and easier to understand.
- **Use parameterized queries** - Never interpolate user input into SQL strings. Always use `.bind()`.
- **Batch load relations** - Use the `dataload` pattern to avoid N+1 query problems.

### Error Handling

- **Use the custom `Error` type** - Don't create new error types. Use `Error::new()`, `Error::internal()`, `Error::forbidden()`, etc.
- **Propagate with `?`** - Let errors bubble up. The error type automatically converts to HTTP responses.
- **Provide helpful messages** - Error messages should help the API consumer understand what went wrong.

### Performance

- **Use `db()` singleton** - Never create new database connections. The pool is managed globally.
- **Avoid blocking in async code** - Use `tokio::task::spawn_blocking` for CPU-intensive work.
- **Batch database operations** - Use `dataload` patterns and batch inserts/updates when possible.

## OpenAPI Schema Generation

The backend uses `aide` to automatically generate OpenAPI documentation from route definitions. When you add or modify routes, entities, or API payloads, you need to regenerate the schema and frontend types.

### Regenerating the API Schema

```bash
just dump-api  # Generates apps/superego/api.json
```

This runs the `dump_api` binary (`src/bin/dump_api.rs`) which builds the router and extracts the OpenAPI schema without starting the server.

### Regenerating Frontend Types

After updating `api.json`, regenerate the TypeScript types:

```bash
cd packages/mikoto.js && pnpm run generate
```

This uses `openapi-zod-client` to generate Zod schemas and API client types in `packages/mikoto.js/src/api.gen.ts`.

### When to Regenerate

Regenerate after any changes to:
- Route handlers (new endpoints, changed paths)
- Request/response types (entities, payloads)
- API documentation annotations
- WebSocket events or commands

### Full Workflow

```bash
# 1. Make backend changes
# 2. Verify Rust compiles
moon superego:typecheck

# 3. Regenerate API schema
just dump-api

# 4. Regenerate frontend types
cd packages/mikoto.js && pnpm run generate

# 5. Verify everything compiles
moon :typecheck
```

## Common Commands

```bash
moon :typecheck          # Type-check Rust and TypeScript
moon :lint               # Run clippy and eslint
moon :lint.fix           # Auto-fix linting issues
moon :format             # Format all code
moon :test               # Run all tests
cargo run -p superego    # Run just the Rust server
cargo test -p superego   # Run Rust tests only
cargo check -p superego  # Quick compilation check
just new-migration name  # Create new migration
just dump-api            # Regenerate OpenAPI schema
```
