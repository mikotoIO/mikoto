# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Mikoto is an open-source messaging platform designed for building online communities. It features thread-based messaging, voice/video chat, and real-time collaborative wiki editing. The project uses a monorepo structure with Moon for task orchestration.

## Development Commands

### Core Development Commands

```bash
# Start all services (PostgreSQL, Redis, MinIO)
docker compose up -d

# Install dependencies
pnpm install
cargo check

# Run all apps in development
pnpm start

# Database setup (run in apps/superego directory)
sqlx database create && sqlx migrate run

# Create new migration
just new-migration migration_name
```

### Useful Tools

```bash
moon :typecheck # Typecheck everything
moon :test # Run all tests
moon :lint # Lint entire project
moon :lint.fix # Fix linting issues
moon :format # Format the entire codebase
```

## Architecture

### Monorepo Structure

- **apps/client** - Web client (React + Vite + TypeScript)
- **apps/superego** - API server (Rust + Axum + SQLx + PostgreSQL)
- **apps/content-proxy** - Content proxy service (Rust)
- **apps/desktop** - Desktop app (Electron)
- **apps/mobile** - Mobile app (React Native + Expo)
- **packages/** - Shared packages including mikoto.js client library

### Client Architecture (React)

The client uses a sophisticated architecture with:

- **Surface-based UI** - Main interface uses "surfaces" for different views (Messages, Documents, Settings)
- **Tab system** - Multi-tab interface with dockable panels using dockview-react
- **Real-time collaboration** - Uses Y.js for collaborative document editing with TipTap/Lexical editors
- **State Management** - Combination of React Query, Recoil, MobX, and Valtio for different concerns
- **WebSocket integration** - Real-time messaging through superego WebSocket API

Key client directories:

- `src/components/surfaces/` - Main application surfaces/views
- `src/store/` - State management and API clients
- `src/components/ui/` - Chakra UI-based design system components
- `src/views/` - Route-level components and providers

### Server Architecture (Rust)

The superego API server uses:

- **Axum framework** - Modern async web framework
- **SQLx** - Compile-time checked SQL queries with PostgreSQL
- **Redis** - Pub/sub for real-time features and caching
- **JWT authentication** - Token-based auth with refresh tokens
- **File storage** - S3-compatible storage (MinIO) for media uploads
- **WebSocket support** - Real-time messaging and collaboration

Key server directories:

- `src/routes/` - API endpoint handlers organized by domain
- `src/entities/` - Database models and business logic
- `src/middlewares/` - Request processing middleware (auth, CORS, etc.)
- `src/functions/` - Utility functions for common operations

### Database

- **PostgreSQL** - Primary database with migrations in `apps/superego/migrations/`
- **SQLx migrations** - Use `sqlx migrate add <name>` to create new migrations
- **Redis** - Used for pub/sub messaging and session storage

## Port Configuration

All services use ports in the 351X range:

### Applications (351X)

- Client: 3510
- Superego API: 3511
- Collab service: 3512
- Media server: 3513

### Infrastructure (351XX)

- PostgreSQL: 35101
- Redis: 35102
- MinIO S3: 35103 (API), 35104 (Console)

## Package Management

- **Root level** - pnpm workspace with Moon task runner
- **Client dependencies** - Uses pnpm, managed in apps/client/package.json
- **Rust dependencies** - Cargo workspaces, managed in Cargo.toml files
- **Shared packages** - TypeScript packages in packages/ directory

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

## Development Workflow

1. Start infrastructure: `docker compose up -d`
2. Install dependencies: `pnpm install && cargo check`
3. Run database migrations: `cd apps/superego && sqlx migrate run`
4. Start development servers: `pnpm start`
5. Access client at http://localhost:3510
6. API documentation at http://localhost:3511/scalar

## Testing

- **Client**: Vitest for unit/integration tests
- **Server**: Cargo test for Rust unit tests
- **E2E**: Not currently configured
