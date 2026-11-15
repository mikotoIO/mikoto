# Superego

This is the API/Websocket server for Mikoto, written in Rust.

## How to run

First, copy `.env.example` to `.env`, and then run:

```sh
cargo run
```

## Tests

```sh
cargo test                # unit + integration tests
cargo test --test api     # integration tests only
```

The integration tests in `tests/api` boot the real router and talk to it
over HTTP and WebSocket. They need Postgres and Redis on the docker-compose
ports (`docker compose up -d postgres redis`), and recreate a `mikoto_test`
database on every run. Point them elsewhere with `TEST_DATABASE_URL` (the
database name must end in `_test`) and `TEST_REDIS_URL`. Without the
services they are skipped with a warning, unless `CI` or
`MIKOTO_REQUIRE_INTEGRATION` is set.

Set up data with the helpers in `tests/api/fixtures.rs` rather than the API,
unless the API call is what you're testing:

```rust
#[test]
fn moderators_can_delete_messages() {
    run(|app| async move {
        let space = fixtures::space(&fixtures::user().await).await;
        let author = fixtures::member(&space).await;
        let moderator = fixtures::member_with(&space, Permission::MODERATOR).await;
        let id = fixtures::message(space.general, &author, "spam").await;

        app.delete(&format!("{}/{id}", space.messages(space.general)))
            .auth(&moderator)
            .send()
            .await
            .ok();
    });
}
```
