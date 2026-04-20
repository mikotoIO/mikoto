import type { Provider } from '@lexical/yjs';
import { MikotoChannel } from '@mikoto-io/mikoto.js';
import { useCallback, useRef } from 'react';
import { WebsocketProvider } from 'y-websocket';
import * as Y from 'yjs';

import { env } from '@/env';
import { useMikoto } from '@/hooks';

// Custom message tag used by the server to tell exactly one peer per room
// that it has been elected to seed the Y.Doc from Postgres markdown. Must
// match `MSG_BOOTSTRAP_ELECT` in apps/superego/src/routes/channels/documents.rs.
const MSG_BOOTSTRAP_ELECT = 10;

export interface UseProviderFactoryProps {
  channel: MikotoChannel;
}

export type SyncState = 'initial' | 'syncing' | 'synced' | 'error';

export function useProviderFactory({ channel }: UseProviderFactoryProps) {
  const mikoto = useMikoto();

  // Handle to the most recent provider this factory produced. Exposed so
  // consumers (the CollabPlugin) can listen for the server's election event
  // without having to reach inside CollaborationPlugin's internals.
  const providerRef = useRef<WebsocketProvider | null>(null);

  const providerFactory = useCallback(
    (id: string, yjsDocMap: Map<string, Y.Doc>): Provider => {
      // Reuse any existing doc in the map. React StrictMode double-invokes
      // this factory; if we minted a fresh Y.Doc each time, the second doc's
      // clientID would not match the binding's captured clientID — and the
      // local user's own awareness entry would slip past Lexical's
      // self-cursor filter and render as a remote presence.
      let doc = yjsDocMap.get(id);
      if (!doc) {
        doc = new Y.Doc();
        yjsDocMap.set(id, doc);
      }

      // `connect: false` is critical: Lexical's CollaborationPlugin attaches
      // observeDeep + onSync + the editor update listener inside a useEffect
      // that runs after this factory. If we let the WebsocketProvider connect
      // immediately (the default), SyncStep2 can land before those listeners
      // are wired up — Y.applyUpdate populates the Y.Doc silently, the
      // Lexical tree ends up empty, and subsequent remote updates then throw
      // "could not find element node". Lexical's effect calls
      // provider.connect() itself, so deferring is safe.
      const ws = new WebsocketProvider(env.PUBLIC_COLLABORATION_URL, id, doc, {
        params: { token: mikoto.getAccessToken() ?? '' },
        connect: false,
      });

      // Register a handler for the server's bootstrap-election message.
      // The server sends this exactly once per Room lifetime to the peer
      // that won `AtomicBool::compare_exchange(false, true)`. Other peers
      // never receive it and must therefore NOT run the markdown bootstrap.
      const wsAny = ws as unknown as {
        messageHandlers: Array<unknown>;
        emit: (event: string, args: unknown[]) => void;
      };
      wsAny.messageHandlers[MSG_BOOTSTRAP_ELECT] = () => {
        wsAny.emit('bootstrap-elect', []);
      };

      providerRef.current = ws;
      return ws as unknown as Provider;
    },
    // channel.id is stable for a given editor mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [channel.id],
  );

  return { providerFactory, providerRef };
}
