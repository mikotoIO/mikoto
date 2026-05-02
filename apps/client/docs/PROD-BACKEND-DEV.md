# Running the dev client against the production backend

A design-engineer devflow for iterating on the client UI against real
production data (real spaces, real users, real messages) without standing
up a local superego.

## TL;DR

```sh
just run-client-prod
# open http://localhost:3510
```

Under the hood this runs `moon run client:dev.prod-backend`, which runs
`vite --mode prod-backend` from `apps/client/`.

You'll log in with your regular prod Mikoto account. All REST calls,
WebSockets, collab (Y.js), and media uploads/downloads transparently
proxy through the Vite dev server to the prod instance.

## How it works

Going direct from `localhost` to `https://server.platform.mikoto.io` would hit CORS —
the prod superego strictly allows only its own `WEB_URL` origin. Instead
of loosening CORS, we keep the browser same-origin by running everything
through Vite's dev-server proxy:

```
browser ──► http://localhost:3510/__api/...     ──► https://server.platform.mikoto.io/...
browser ──► ws://localhost:3510/__api/ws        ──► wss://server.platform.mikoto.io/ws
browser ──► ws://localhost:3510/__api/collab    ──► wss://server.platform.mikoto.io/collab
browser ──► http://localhost:3510/__media/...   ──► https://cdn.platform.mikoto.io/...
```

Three things make this work:

1. **`apps/client/.env.prod-backend`** sets `PUBLIC_SERVER_URL` and
   `PUBLIC_MEDIASERVER_URL` to the dev server's own origin with a
   `/__api` / `/__media` prefix.
2. **`server.proxy` in `vite.config.ts`** rewrites those prefixes away
   and forwards to the prod origins, with `changeOrigin: true`, `secure:
   true`, and `ws: true` so WebSocket upgrades (main socket +
   `y-websocket` collab) pass through.
3. **`dev.prod-backend` moon task** (declared in `apps/client/moon.yml`)
   runs `vite --mode prod-backend` so Vite picks up the env file.
   `just run-client-prod` is the top-level wrapper.

## Pointing at a different backend (staging, a coworker's tunnel, etc.)

Override the proxy targets without editing the committed config:

```sh
PROXY_API_TARGET=https://server-staging.platform.mikoto.io \
PROXY_MEDIA_TARGET=https://cdn-staging.platform.mikoto.io \
  just run-client-prod
```

## Gotchas

- **Port 3510 is required.** `.env.prod-backend` hard-codes
  `http://localhost:3510/__api` because the mikoto.js client parses it
  with `new URL(...)` and needs an absolute URL. Make sure `PORT=3510`
  is set in the repo-root `.env` (it is by default).
- **Invite links use the prod frontend URL.** `PUBLIC_FRONTEND_URL` is
  set to `https://platform.mikoto.io` so invites you generate locally
  point at prod, which is almost always what you want. If you need
  local-facing invite links, override `PUBLIC_FRONTEND_URL` in a
  `.env.prod-backend.local` (gitignored).
- **This is the real prod DB.** Every action (sending a message,
  deleting a channel, changing your avatar) is real. Design against
  throwaway spaces if you're testing destructive flows.
- **Service workers:** push notifications won't meaningfully work
  against prod from localhost — the SW is scoped to localhost and
  VAPID endpoints will be tied to this origin.
