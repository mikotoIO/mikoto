# Mikoto Project Guide

## Commands

- **Build**: `pnpm build` (all packages), `vite build` (client)
- **Dev**: `pnpm start` (all services), `vite` (client)
- **Test**: `jest` (client), `vitest run` (mikoto.js), `cargo test` (Rust)
- **Single Test**: `jest -t "test name"`, `vitest run test.spec.ts`
- **Lint**: `pnpm lint`, `cargo clippy`
- **Typecheck**: `moon :typecheck` (uses tsc --noEmit for TS, uses cargo check for Rust)
- **Format**: `pnpm format` (runs prettier)

## Code Style

- **TypeScript**: Strict mode, Airbnb style guidelines
- **Imports**: Sorted using @trivago/prettier-plugin-sort-imports
- **Formatting**: Single quotes, trailing commas
- **Components**: React functional components with TypeScript interfaces
- **Naming**: PascalCase for components, camelCase for variables/functions
- **Error Handling**: Use custom error types in Rust, try/catch with typed errors in TS
- **State Management**: Valtio for JS client
- **APIs**: Generated from OpenAPI specs with Zod validation

Refer to `.eslintrc.js` and `tsconfig.json` for more detailed rules.
