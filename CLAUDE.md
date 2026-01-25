# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Mikoto is an open-source messaging platform designed for building online communities. It features thread-based messaging, voice/video chat, and real-time collaborative wiki editing. The project uses a monorepo structure with Moon for task orchestration.

## Development Commands

### Useful Tools

```bash
moon :typecheck # Typecheck everything
moon :test # Run all tests
moon :lint # Lint entire project
moon :lint.fix # Fix linting issues
moon :format # Format the entire codebase
just new-migration migration_name # new migration
```

## Architecture

Check `ARCHITECTURE.md`.

## Key Technologies

### Frontend Stack

- React 18 with TypeScript
- Chakra UI for component library
- React Router for navigation
- Vite for build tooling
- Vitest for testing
- Y.js + Lexical for collaborative editing
- React Query for server state
- Socket.io for real-time communication

### Backend Stack

- Rust with Axum web framework
- SQLx for database operations
- PostgreSQL as primary database
- Redis for pub/sub and caching
- JWT for authentication
- MinIO for S3-compatible object storage
- LiveKit integration for voice/video

### Development Tools

- Moon for monorepo task orchestration
- Docker Compose for local development services
- ESLint + Prettier for code formatting
- Cargo clippy for Rust linting
- PNPM workspaces for JavaScript package management

## Testing

- **Client**: Vitest for unit/integration tests
- **Server**: Cargo test for Rust unit tests
- **E2E**: Not currently configured

## Important Tips

- Use the rustdoc MCP, if available, to get up-to-date information about Rust crate documentations, instead of web searching by default.
- Before adding any new package, use the rustdoc crate search to check for the version.
- Instead of reading the migrations, you can read schema.sql for the up-to-date dump of the database schema.
- at the end of your task, run moon :typecheck to check both Rust and TypeScript parts of the codebase.
- the main branch is named `dev`, not `main`.

# Skills

- If you think there is even a 1% chance a skill might apply to what you are doing, you ABSOLUTELY MUST invoke the skill.
- If you think a skill might apply, invoke the skill. It is okay to invoke the wrong skills - you're not forced to use it if you invoke a wrong skill by mistake.
- Activate domain skills BEFORE starting work in a specific part of the codebase to understand the existing patterns.
