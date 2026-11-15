import { $convertToMarkdownString } from '@lexical/markdown';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { MikotoChannel } from '@mikoto-io/mikoto.js';
import { useCallback, useEffect, useRef, useState } from 'react';
import { WebsocketProvider } from 'y-websocket';
import * as Y from 'yjs';
import { z } from 'zod';

import { env } from '@/env';
import { useMikoto } from '@/hooks';

import { DOCUMENT_TRANSFORMERS } from './transformers';

export type SyncState = 'initial' | 'synced' | 'syncing' | 'error';

/** Someone else with this doc open, from the Y.js awareness channel. */
export interface DocPeer {
  key: string;
  name: string;
  color: string;
  userId?: string;
}

// Lexical's CollaborationPlugin writes { name, color, awarenessData } into
// awareness; other clients may be older, so read it defensively.
const awarenessStateSchema = z.object({
  name: z.string().catch('Someone'),
  color: z.string().catch('#9ea0a8'),
  awarenessData: z
    .object({ userId: z.string().optional() })
    .optional()
    .catch(undefined),
});

function readPeers(provider: WebsocketProvider): DocPeer[] {
  const self = provider.awareness.clientID;
  const seen = new Set<string>();
  const peers: DocPeer[] = [];
  provider.awareness.getStates().forEach((state, clientId) => {
    if (clientId === self) return;
    const parsed = awarenessStateSchema.safeParse(state);
    if (!parsed.success) return;
    const { name, color, awarenessData } = parsed.data;
    const userId = awarenessData?.userId;
    // One entry per person, even with the doc open in two tabs.
    const key = userId ?? `client-${clientId}`;
    if (seen.has(key)) return;
    seen.add(key);
    peers.push({ key, name, color, userId });
  });
  return peers;
}

interface UseProviderFactoryProps {
  channel: MikotoChannel;
  onSync?: () => void;
  onStatusChange?: (status: SyncState) => void;
  onPeersChange?: (peers: DocPeer[]) => void;
}

export function useProviderFactory({
  channel,
  onSync,
  onStatusChange,
  onPeersChange,
}: UseProviderFactoryProps) {
  const [syncState, setSyncState] = useState<SyncState>('initial');
  const [editor] = useLexicalComposerContext();
  const mikoto = useMikoto();
  const onSyncRef = useRef(onSync);
  onSyncRef.current = onSync;
  const onStatusRef = useRef(onStatusChange);
  onStatusRef.current = onStatusChange;
  const onPeersRef = useRef(onPeersChange);
  onPeersRef.current = onPeersChange;

  const setSynced = useCallback((state: SyncState) => {
    setSyncState(state);
    onStatusRef.current?.(state);
  }, []);

  // Per-channel cache of the Y.Doc + WebsocketProvider. Lexical's
  // CollaborationPlugin wraps providerFactory in a useMemo whose factory
  // gets invoked twice per render under React StrictMode. Without caching,
  // each invocation would create a separate WebsocketProvider on the same
  // Y.Doc; the orphan one would register a second _updateHandler on the
  // doc observer list and clobber local-edit broadcasting through
  // y-websocket's BroadcastChannel. Keyed by channel id so a channel switch
  // tears down the old provider instead of reusing it for the new room.
  const providerRef = useRef<{
    doc: Y.Doc;
    provider: WebsocketProvider;
    channelId: string;
  } | null>(null);

  // `connect: false` — let Lexical's CollaborationPlugin call `.connect()`
  // itself. Its `sync` handler must be registered before the WS opens,
  // otherwise the initial sync event fires before the handler is attached
  // and shouldBootstrap never runs.
  const providerFactory = useCallback(
    (id: string, yjsDocMap: Map<string, Y.Doc>) => {
      if (providerRef.current && providerRef.current.channelId !== id) {
        providerRef.current.provider.disconnect();
        providerRef.current.provider.destroy();
        providerRef.current.doc.destroy();
        providerRef.current = null;
      }
      if (!providerRef.current) {
        const doc = new Y.Doc();
        const provider = new WebsocketProvider(
          `${env.PUBLIC_SERVER_URL.replace(/^http/, 'ws')}/collab`,
          id,
          doc,
          {
            connect: false,
            params: { token: mikoto.auth.getAccessToken() ?? '' },
          },
        );

        provider.on('sync', (isSynced: boolean) => {
          if (isSynced) {
            onSyncRef.current?.();
            setSynced('synced');
          }
        });

        provider.on('status', ({ status }: { status: string }) => {
          if (status === 'connecting') setSynced('syncing');
          if (status === 'disconnected') setSynced('error');
        });

        provider.on('connection-error', () => setSynced('error'));

        provider.awareness.on('change', () => {
          onPeersRef.current?.(readPeers(provider));
        });

        providerRef.current = { doc, provider, channelId: id };
      }
      yjsDocMap.set(id, providerRef.current.doc);
      return providerRef.current.provider;
    },
    [mikoto, setSynced],
  );

  // Nobody is "here" once this editor goes away.
  useEffect(() => () => onPeersRef.current?.([]), []);

  const save = () => {
    const content = editor
      .getEditorState()
      .read(() =>
        $convertToMarkdownString(DOCUMENT_TRANSFORMERS, undefined, true),
      );

    channel
      .updateDocument({ content })
      .then(() => setSynced('synced'))
      .catch((e) => {
        console.error(e);
        setSynced('error');
      });
  };

  return { providerFactory, synced: syncState, setSynced, save };
}
