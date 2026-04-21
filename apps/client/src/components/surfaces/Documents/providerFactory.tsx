import {
  $convertToMarkdownString,
  TRANSFORMERS,
} from '@lexical/markdown';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { MikotoChannel } from '@mikoto-io/mikoto.js';
import { useCallback, useRef, useState } from 'react';
import { WebsocketProvider } from 'y-websocket';
import * as Y from 'yjs';

import { useMikoto } from '@/hooks';
import { env } from '@/env';

export interface UseProviderFactoryProps {
  channel: MikotoChannel;
  onSync?: () => void;
}

export type SyncState = 'initial' | 'synced' | 'syncing' | 'error';

export function useProviderFactory({
  channel,
  onSync,
}: UseProviderFactoryProps) {
  const [synced, setSynced] = useState<SyncState>('initial');
  const [editor] = useLexicalComposerContext();
  const mikoto = useMikoto();
  const onSyncRef = useRef(onSync);
  onSyncRef.current = onSync;

  // Per-mount cache of the Y.Doc + WebsocketProvider. Lexical's
  // CollaborationPlugin wraps providerFactory in a useMemo whose factory
  // gets invoked *twice* per render in React StrictMode (purity check).
  // Without caching, each invocation creates a brand new WebsocketProvider
  // — both registered on the same Y.Doc observer list. Only one is wired up
  // by Lexical's useEffect; the other becomes an orphan whose _updateHandler
  // still fires on every Y.Doc transaction, publishing junk into the
  // y-websocket BroadcastChannel and preventing local edits from being
  // written/broadcast correctly. Using a ref means the second factory call
  // returns the same provider the first did.
  const providerRef = useRef<{
    doc: Y.Doc;
    provider: WebsocketProvider;
  } | null>(null);

  // Keep `connect: false` so Lexical's CollaborationPlugin is the one that
  // calls .connect() — it needs to register its own `sync` handler *before*
  // the WS opens, otherwise the initial sync event fires before the handler
  // is attached and shouldBootstrap never runs.
  const providerFactory = useCallback(
    (id: string, yjsDocMap: Map<string, Y.Doc>) => {
      if (!providerRef.current) {
        const doc = new Y.Doc();
        const provider = new WebsocketProvider(
          env.PUBLIC_COLLABORATION_URL,
          id,
          doc,
          {
            connect: false,
            params: { token: mikoto.auth.accessToken ?? '' },
          },
        );

        const clientID = doc.clientID;
        doc.on('update', (update: Uint8Array, origin: unknown) => {
          const label =
            origin === provider
              ? 'provider(incoming)'
              : origin == null
                ? 'null'
                : (origin as object).constructor.name;
          console.log(
            `[collab:${clientID}] doc update ${update.length}b origin=${label}`,
          );
        });

        // Monkey-patch transact to see every attempted write, even empty ones
        // (a transact that produces zero ops fires no 'update' event).
        const origTransact = doc.transact.bind(doc);
        (doc as unknown as { transact: typeof origTransact }).transact = ((
          fn: (tx: unknown) => void,
          origin: unknown,
        ) => {
          const label =
            origin == null
              ? 'null'
              : (origin as object).constructor?.name ?? String(origin);
          const svBefore = Y.encodeStateVector(doc);
          const result = origTransact(fn, origin);
          const svAfter = Y.encodeStateVector(doc);
          const changed =
            svBefore.length !== svAfter.length ||
            svBefore.some((b, i) => b !== svAfter[i]);
          console.log(
            `[collab:${clientID}] transact origin=${label} changed=${changed} svBefore=${svBefore.length}b svAfter=${svAfter.length}b`,
          );
          return result;
        }) as typeof doc.transact;

        provider.on('sync', (isSynced: boolean) => {
          console.log(`[collab:${clientID}] sync event:`, isSynced);
          if (isSynced) {
            onSyncRef.current?.();
            setSynced('synced');
          }
        });

        provider.on('status', ({ status }: { status: string }) => {
          console.log(`[collab:${clientID}] status:`, status);
          if (status === 'connecting') setSynced('syncing');
          if (status === 'disconnected') setSynced('error');
        });

        providerRef.current = { doc, provider };
      }
      yjsDocMap.set(id, providerRef.current.doc);
      return providerRef.current.provider;
    },
    [mikoto],
  );

  const save = () => {
    const content = editor
      .getEditorState()
      .read(() => $convertToMarkdownString(TRANSFORMERS));

    channel
      .updateDocument({ content })
      .then(() => setSynced('synced'))
      .catch((e) => {
        console.error(e);
        setSynced('error');
      });
  };

  return { providerFactory, synced, setSynced, save };
}
