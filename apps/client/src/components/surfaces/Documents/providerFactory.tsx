import {
  $convertToMarkdownString,
  TRANSFORMERS,
} from '@lexical/markdown';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { MikotoChannel } from '@mikoto-io/mikoto.js';
import { useCallback, useState } from 'react';
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

  const providerFactory = useCallback(
    (id: string, yjsDocMap: Map<string, Y.Doc>) => {
      const doc = new Y.Doc();
      yjsDocMap.set(id, doc);

      const provider = new WebsocketProvider(
        env.PUBLIC_COLLABORATION_URL,
        id,
        doc,
        {
          connect: false,
          params: { token: mikoto.auth.accessToken ?? '' },
        },
      );

      provider.on('sync', (isSynced: boolean) => {
        if (isSynced) {
          onSync?.();
          setSynced('synced');
        }
      });

      provider.on('status', ({ status }: { status: string }) => {
        if (status === 'connecting') setSynced('syncing');
        if (status === 'disconnected') setSynced('error');
      });

      mikoto.auth.refresh().finally(() => {
        provider.connect();
      });

      return provider;
    },
    [mikoto, onSync],
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
