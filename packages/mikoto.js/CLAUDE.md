# mikoto.js (TypeScript API client)

- `src/api.gen.ts` is generated from superego's `api.json`. Never edit it by hand; run `just generate` from the repo root.
- `MikotoClient` exposes `rest` (the generated client), `ws` (`WebsocketApi`), and resource managers in `src/managers/`.
- Managers extend `CachedManager<T>` (`managers/base.ts`). They keep Valtio `proxyMap` caches and subscribe to WebSocket events so data stays live. See `src/managers/ARCHITECTURE.md` for the `_patch` / `_get` / `_insert` / `_delete` contract.
- The client app typechecks against the **built** package, so `just typecheck` builds it first. If you change exports, rebuild before checking the client.
- **Connection lifecycle** lives in `WebsocketApi`: one long-lived instance per client (`client.ws`), so `ws.on(...)` subscriptions survive reconnects. It authenticates with a fresh token on every attempt, waits for the server's `ready`, heartbeats with `ping`/`pong`, and reconnects with jittered exponential backoff (`helpers/retry.ts`); while the browser is offline it waits for the `online` event. Observe it with `client.connection` / `client.onConnectionChange()`; `client.reconnectNow()` skips the wait.
- **After a reconnect** the client calls `resync()`: managers re-list (`spaces.sync()`, `relationships.sync()`, `user.load()`), pruning anything that disappeared, then `onResync` listeners run so the app can refetch what managers don't own (e.g. an open message list).
- **Tokens**: `client.getAccessToken()` refreshes from the JWT's `exp` (60s margin); REST requests renew and retry once on a 401. Use `retry()` / `isAuthError()` / `isTransientError()` from `helpers/retry.ts` instead of hand-rolled retry loops.
