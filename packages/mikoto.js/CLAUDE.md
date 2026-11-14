# mikoto.js (TypeScript API client)

- `src/api.gen.ts` is generated from superego's `api.json`. Never edit it by hand; run `just generate` from the repo root.
- `MikotoClient` exposes `rest` (the generated client), `ws` (`WebsocketApi`), and resource managers in `src/managers/`.
- Managers extend `CachedManager<T>` (`managers/base.ts`). They keep Valtio `proxyMap` caches and subscribe to WebSocket events so data stays live. See `src/managers/ARCHITECTURE.md` for the `_patch` / `_get` / `_insert` / `_delete` contract.
- The client app typechecks against the **built** package, so `just typecheck` builds it first. If you change exports, rebuild before checking the client.
