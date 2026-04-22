import { $convertToMarkdownString } from '@lexical/markdown';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { MikotoChannel } from '@mikoto-io/mikoto.js';
import { useCallback, useRef, useState } from 'react';
import { WebsocketProvider } from 'y-websocket';
import * as Y from 'yjs';

import { env } from '@/env';
import { useMikoto } from '@/hooks';

import { DOCUMENT_TRANSFORMERS } from './transformers';

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

        providerRef.current = { doc, provider, channelId: id };
      }
      yjsDocMap.set(id, providerRef.current.doc);
      return providerRef.current.provider;
    },
    [mikoto],
  );

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

  return { providerFactory, synced, setSynced, save };
}
