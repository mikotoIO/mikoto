//! Integration tests for the superego API: a real server, Postgres and Redis.
//! See `harness.rs` for how to run them locally.

mod fixtures;
mod harness;
mod ws;

mod account;
mod channels;
mod emojis;
mod messages;
mod moderation;
mod reactions;
mod realtime;
mod relations;
mod spaces;
