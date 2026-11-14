# client (React web app)

React + Vite + Chakra UI v3, talking to superego through `@mikoto-io/mikoto.js`.

```
src/
├── components/
│   ├── atoms/ molecules/   # small → compound components
│   ├── surfaces/           # tab/panel views (one per surface kind)
│   ├── modals/ sidebars/ tabs/
│   ├── ui/                 # Chakra component wrappers: import from '@/components/ui'
│   └── design/
├── views/                  # top-level routes (MainView, auth views)
├── hooks/                  # useMikoto(), useAuthClient(), ...
├── store/                  # Jotai atoms, LocalDB, surface/tab state
└── functions/              # queryClient, fileUpload, notify, ...
```

## Patterns

- **Styling**: Chakra v3 (not v2; the APIs differ), using semantic tokens (`bg.subtle`, `fg.muted`, `border`). Lots of legacy code uses `@emotion/styled`; new code should prefer Chakra.
- **Surfaces**: tabs/panels are surface kinds mapped to components in `components/surfaces` and rendered in DockView. Tabs are keyed `kind/key`; heavy surfaces are `React.lazy`-loaded. Use `useTabkit()` (`store/surface.ts`) to open/close tabs.
- **Modals**: `useModalKit()` (`store/index.ts`). **Context menus**: `useContextMenu` / `useContextMenuX` (`components/ContextMenu.tsx`).
- **State**:
  - Jotai is for UI state.
  - Valtio proxies (inside mikoto.js managers) hold live data.
  - React Query handles one-off server fetches. `structuralSharing` is off because mikoto.js returns class instances.
  - `store/LocalDB.ts` is Zod-validated localStorage.
- **API**: `const mikoto = useMikoto()`. Prefer the managers (`mikoto.spaces`, ...); raw REST is `mikoto.rest['spaces.get'](...)`. Don't hand-write API types; they're generated (`just generate`).
- **Routing**: react-router v6. `:spaceRef` accepts a UUID or an `@handle`.

## Conventions

- Use `@/` imports for anything inside `src/`; add new components to the folder's `index.ts` barrel.
- No `as` casts or `any`; narrow with type guards or Zod instead.
- Check `@/hooks` and `store/` before writing new state logic.
- Dev server: `just run-client` (or `just run-client-prod` to hit the production backend).
