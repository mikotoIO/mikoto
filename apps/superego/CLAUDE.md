# superego (Rust API server)

Axum + aide (OpenAPI) + SQLx/Postgres + Redis pub/sub.

```
src/
├── entities/     # DB models + query macros (entities/macros.rs)
├── routes/       # handlers; routes/router.rs defines AppRouter
├── middlewares/  # auth (Claims), load (Load<T> extractor)
├── functions/    # jwt, permissions, pubsub, rate_limit, ...
├── error.rs      # the one Error type
└── db.rs         # db() global pool
```

## Patterns

- **Entities** use the macros in `src/entities/macros.rs`: `entity!` (DB row), `model!` (DTO/payload), `db_enum!` (Postgres enum), plus `db_find_by_id!`, `db_list_where!`, `db_entity_delete!` for common queries.
- **Relations** go in an `*Ext` struct (`#[serde(flatten)] base` + related fields) with `dataload(Vec<T>)` / `dataload_one(T)` that batch-load relations. Never query per row (N+1).
- **Routes** are registered on `AppRouter` with aide's `get_with`/`post_with`/... so they appear in the OpenAPI schema. WebSocket handlers use `.ws_command(name, ...)` / `.ws_event(name, filter)` on the same router.
- **`Load<T>`** (`middlewares/load.rs`) loads an entity from path params; `Claims` requires auth.
- **Permissions**: `functions/permissions.rs`: `permissions(&space, &member, Permission::X)?`, or the `_or_admin` / `_or_moderator` variants. Space owners bypass all checks.
- **Errors**: only use `crate::error::Error` (`Error::forbidden`, `Error::unauthorized`, `Error::internal`, `Error::new(code, status, msg)`, ...); don't add new error types. Propagate with `?`.
- **DB**: always go through `db()`; never open new connections. Use `.bind()`, never string-interpolate SQL.
- **Real-time**: after mutations, `emit_event("messages.onCreate", &data, &format!("space:{id}")).await?` (`functions/pubsub.rs`).
- No `unwrap()`/`expect()` outside tests unless the invariant is commented.

## Conventions

- Tables are quoted PascalCase (`"Message"`); Rust fields snake_case; JSON camelCase via serde.
- IDs are `Uuid`; timestamps are `DateTime<Utc>`.
- Schema: read `schema.sql`, not the migrations. New migration: `just new-migration <name>` (plain SQL).

## API changes

Any change to routes, payloads, entities or WS events changes the public API. Run `just generate` to regenerate `api.json`, the mikoto.js TS client (`packages/mikoto.js/src/api.gen.ts`) and the Rust `mikoto-client` bindings, then `just typecheck`.
