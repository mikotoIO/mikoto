## Architecture guide

### Monorepo Structure

- **apps/client** - Web client (React + Vite + TypeScript)
- **apps/superego** - API server (Rust + Axum + SQLx + PostgreSQL)
- **apps/content-proxy** - Content proxy service (Rust)
- **apps/desktop** - Desktop app (Electron)
- **packages/** - Shared packages including mikoto.js client library

### Client Architecture (React)

The client uses a sophisticated architecture with:

- **Surface-based UI** - Main interface uses "surfaces" for different views (Messages, Documents, Settings)
- **Tab system** - Multi-tab interface with dockable panels using dockview-react
- **Real-time collaboration** - Uses Y.js for collaborative document editing with Lexical editors
- **State Management** - Combination of React Query, Jotai, and Valtio for different concerns
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
- **File storage** - S3-compatible storage (RustFS) for media uploads
- **WebSocket support** - Real-time messaging and collaboration

Key server directories:

- `src/routes/` - API endpoint handlers organized by domain
- `src/entities/` - Database models and business logic
- `src/middlewares/` - Request processing middleware (auth, CORS, etc.)
- `src/functions/` - Utility functions for common operations

### Database

- **PostgreSQL** - Primary database with migrations in `apps/superego/migrations/`
- **Redis** - Used for pub/sub messaging and session storage

## Port Configuration

All apps use ports in the 351X range, while supporting infrastructure uses 351XX:

### Applications (351X)

- Client: 3510
- Superego API: 3511
- Collab service: 3512
- Media server: 3513

### Infrastructure (351XX)

- PostgreSQL: 35101
- Redis: 35102
- RustFS S3: 35103 (API), 35104 (Console)

## Package Management

- **Root level** - pnpm workspace with Moon task runner
- **Client dependencies** - Uses pnpm, managed in apps/client/package.json
- **Rust dependencies** - Cargo workspaces, managed in Cargo.toml files
- **Shared packages** - TypeScript packages in packages/ directory
