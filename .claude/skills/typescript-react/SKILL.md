---
name: typescript-react
description: Contains TypeScript/React patterns and conventions for the Mikoto frontend. ALWAYS activate before working on frontend code in apps/client/ or packages/.
---

# TypeScript/React Development in Mikoto

## Activation

TRIGGER when: working on frontend code in `apps/client/`, `packages/mikoto.js/`, or any TypeScript/React files.

## Project Structure

```
apps/client/src/
├── components/
│   ├── atoms/          # Small, single-purpose (Avatar, SpaceIcon)
│   ├── molecules/      # Compound components (markdown, editors)
│   ├── surfaces/       # Page/tab views (MessageSurface, DocumentChannel)
│   ├── modals/         # Modal dialogs
│   ├── sidebars/       # Sidebar components
│   ├── tabs/           # Tab UI components
│   ├── ui/             # Chakra UI component re-exports
│   ├── icons/          # Custom FontAwesome icons
│   └── design/         # Design system components
├── views/              # Top-level views (MainView, AuthView)
├── hooks/              # Custom React hooks
├── store/              # Jotai atoms, LocalDB
└── functions/          # Utility functions (fileUpload, notify)

packages/
├── mikoto.js/          # Core API client library
│   ├── managers/       # Resource managers (SpaceManager, ChannelManager)
│   ├── WebsocketApi.ts # WebSocket connection
│   ├── MikotoClient.ts # Main client class
│   ├── AuthClient.ts   # Authentication
│   └── api.gen.ts      # Auto-generated types from OpenAPI
├── mikoto-ui/          # UI component library
├── permcheck/          # Permission checking utilities
├── lexical-markdown/   # Markdown editing plugin
└── tsconfig/           # Shared TypeScript config
```

## Component Patterns

All components are **functional** with **typed props interfaces**:

```tsx
export const Avatar = (
  props: {
    src?: string | null;
    userId?: string;
    size?: number;
  } & React.HTMLAttributes<HTMLImageElement>,
) => {
  const { src, userId, size, ...rest } = props;

  // implementation

  return <img src={src} size={size} {...rest} />;
};
```

### Styling

We use [Chakra UI](/.claude/skills/chakra-ui)

```tsx
import { chakra } from '@chakra-ui/react';

// Chakra factory
const Card = chakra('div', {
  base: { p: '4', bg: 'bg.panel' },
});
```

There's a lot of legacy code that uses Emotion styled-components, but we're migrating to Chakra UI.

### Surface System (Tab/Panel Management)

Components map to surface kinds for dynamic rendering:

```tsx
const surfaceMap = {
  textChannel: MessageSurface,
  voiceChannel: lazy(() => import('./Voice')),
  documentChannel: lazy(() => import('./Documents')),
  search: SearchSurface,
  spaceSettings: SpaceSettingsSurface,
  // ...
};
```

- Surfaces are lazy-loaded with `React.lazy()` and `Suspense`
- DockView manages multi-pane layout
- Tabs identified by `kind/key` format

### Modal Pattern

```tsx
// Modals use useModalKit() hook
// State managed through modalState atom
// Content rendered in Chakra DialogRoot
```

### Context Menu Pattern

```tsx
// useContextMenu() hook
// Position-aware with auto-flip near viewport edge
// Dismisses on outside click or Escape
```

## State Management

Three state tools are used for different purposes:

### Jotai (UI/Client State)

```tsx
import { atom, useAtom, useAtomValue, useSetAtom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

// Simple atom
const rightBarOpenState = atom(false);

// Persisted atom
const themeState = atomWithStorage('theme', 'dark');

// Atom family (parameterized)
const tabNameFamily = atomFamily((id: string) => atom(''));

// Usage
const [value, setValue] = useAtom(rightBarOpenState);
const value = useAtomValue(rightBarOpenState);
const setValue = useSetAtom(rightBarOpenState);
```

### Valtio (Reactive Data/Managers)

Used in `mikoto.js` for reactive object proxies:

```tsx
import { proxy, useSnapshot } from 'valtio';
import { proxyMap } from 'valtio/utils';

// CachedManager uses proxyMap for collections
// useMaybeSnapshot() for conditional proxy observation
```

### React Query (Server State)

```tsx
// QueryClient configured with structuralSharing: false
// (due to Mikoto.js class objects)
```

### LocalDB (Typed localStorage)

```tsx
import { LocalDB } from '@/store/LocalDB';

// Runtime type-safe wrapper using Zod
const db = new LocalDB('key', schema, initFunction);
db.get(); // typed
db.set(value); // validated
```

## API Client (mikoto.js)

### MikotoClient

```tsx
import { useMikoto } from '@/hooks';

function MyComponent() {
  const mikoto = useMikoto();

  // REST calls use bracket notation
  const space = await mikoto.rest['spaces.get'](undefined, {
    params: { spaceId: id },
  });

  // WebSocket operations
  mikoto.ws.send('typing.start', { channelId });
}
```

### Manager Pattern

Managers wrap REST/WebSocket with caching:

```tsx
// SpaceManager, ChannelManager, UserManager, etc.
// Extend CachedManager<T> for cached resources
// Methods: _get(), _insert(), _delete(), values()
// Auto-subscribe to WebSocket events for real-time updates
```

### Context Hooks

```tsx
export function useMikoto(): MikotoClient; // Main client
export function useAuthClient(): AuthClient; // Auth client
```

## Routing

React Router v6 with browser router:

```
/                                          → MainView (shell)
/spaces, /friends, /discover, /settings    → Top-level views
/space/:spaceRef                           → Space view
/space/:spaceRef/channel/:channelId        → Channel view
/space/:spaceRef/settings                  → Space settings
/login, /register, /forgotpassword         → Auth views
/invite/:inviteCode                        → Invite handler
```

- `:spaceRef` accepts both UUIDs and @handles
- Routes wrapped with `MikotoClientProvider` for auth

## Custom Hooks

```tsx
// Context access
useMikoto(); // MikotoClient instance
useAuthClient(); // AuthClient instance

// Data fetching
useFetchMember(space); // Load space members

// UI utilities
useContextMenu(fn); // Right-click menus
useContextMenuX(); // Extended context menu
useModalKit(); // Modal management
useTabkit(); // Tab operations
useInterval(cb, ms); // setInterval wrapper
useIsMobile(); // Mobile detection
useErrorElement(); // Error boundary helper
```

## TypeScript Conventions

### Config

- **Strict mode**: `true`
- **Target**: `es2020`
- **Module resolution**: `bundler`
- **JSX**: `react-jsx` (new transform)
- **Path alias**: `@/*` → `./src/*`

### Type Patterns

```tsx
// Props: always interface
interface ButtonProps {
  variant?: 'solid' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

// Unions/mapped types: use type
type ConnectionState = 'connecting' | 'reconnecting' | 'disconnected';

// Zod for runtime validation
import { z } from 'zod';
const schema = z.object({ name: z.string() });

// Generic constraints
class CachedManager<T extends { id: string }> { ... }
```

### Strict Safety

- No implicit `any`
- Optional chaining (`?.`) and nullish coalescing (`??`) used throughout
- Type guards with `is` keyword
- Discriminated unions for state types

## File Naming

| Type          | Convention                  | Example                         |
| ------------- | --------------------------- | ------------------------------- |
| Components    | PascalCase                  | `Avatar.tsx`, `UserArea.tsx`    |
| Hooks         | camelCase with `use` prefix | `useInterval.ts`                |
| Utilities     | camelCase                   | `fileUpload.ts`                 |
| Types/Classes | PascalCase                  | `LocalDB.ts`, `MikotoClient.ts` |
| Directories   | camelCase or kebab-case     | `atoms/`, `mikoto-ui/`          |

## Import Conventions

```tsx
// Path alias (always use for app imports)
import { Avatar } from '@/components/atoms/Avatar';
import { Button, Dialog } from '@/components/ui';
// Barrel exports from index files
import { useAuthClient, useMikoto } from '@/hooks';
```

## Key Dependencies

| Category  | Libraries                                                 |
| --------- | --------------------------------------------------------- |
| UI        | `@chakra-ui/react` v3, `@emotion/styled`, `framer-motion` |
| State     | `jotai`, `valtio`, `@tanstack/react-query` v5             |
| Editors   | `lexical`, `slate`, `y.js`                                |
| Real-time | `socket.io-client`, `livekit-client`                      |
| Forms     | `react-hook-form`, `zod`                                  |
| Layout    | `dockview-react`, `re-resizable`, `react-virtuoso`        |
| Icons     | `@fortawesome/react-fontawesome`, `react-icons`           |
| Routing   | `react-router-dom` v6                                     |

## Development Commands

```bash
pnpm dev                # Vite dev server (from apps/client/)
moon :typecheck         # Monorepo-wide type check
moon :lint              # ESLint
moon :lint.fix          # Auto-fix lint issues
moon :format            # Prettier
moon :test              # Vitest
moon :generate          # Regenerate API types from OpenAPI schema
```

## Testing

```tsx
import { expect, test } from 'vitest';

test('description', () => {
  expect(result).toBe(expected);
});
```

## Best Practices

- **Use `@/` imports** for all app-internal imports
- **No casts** - prefer to check the types/use zod validators, over using `as` (especially no `any`)
- **Type all props** with named interfaces, not inline types
- **Use Jotai** for UI state, **Valtio** for data proxies, **React Query** for server state
- **Lazy load** surfaces and heavy components with `React.lazy()`
- **Use existing hooks** — check `@/hooks` before writing new state logic
- **Use barrel exports** — add new components to relevant `index.ts`
- **Run `moon :typecheck`** after all frontend changes
- **Use Chakra semantic tokens** (`bg.subtle`, `fg.muted`, `border`) for theme compatibility
- **Prefer Chakra style props** over inline CSS, but Emotion `styled` is acceptable for complex components
