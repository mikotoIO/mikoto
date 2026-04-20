import {
  $convertFromMarkdownString,
  TRANSFORMERS,
} from '@lexical/markdown';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import type { Provider } from '@lexical/yjs';
import { MikotoChannel } from '@mikoto-io/mikoto.js';
import { useCallback, useState } from 'react';
import { WebsocketProvider } from 'y-websocket';
import * as Y from 'yjs';

import { env } from '@/env';
import { useMikoto } from '@/hooks';

export interface UseProviderFactoryProps {
  channel: MikotoChannel;
  content: string;
  onSync?: () => void;
}

export type SyncState = 'initial' | 'syncing' | 'synced' | 'error';

export function useProviderFactory({
  channel,
  content,
  onSync,
}: UseProviderFactoryProps) {
  const mikoto = useMikoto();
  const [synced, setSynced] = useState<SyncState>('initial');
  const [editor] = useLexicalComposerContext();

  const providerFactory = useCallback(
    (id: string, yjsDocMap: Map<string, Y.Doc>): Provider => {
      const doc = new Y.Doc();
      yjsDocMap.set(id, doc);

      const ws = new WebsocketProvider(env.PUBLIC_COLLABORATION_URL, id, doc, {
        params: { token: mikoto.getAccessToken() ?? '' },
      });

      ws.on('sync', (isSynced: boolean) => {
        if (!isSynced) return;
        // If the server-side doc is empty (no client has ever contributed),
        // this is the first editor in the room — seed it with the markdown
        // persisted in Postgres.
        if (doc.store.clients.size === 0 && content) {
          editor.update(
            () => {
              $convertFromMarkdownString(content, TRANSFORMERS);
            },
            { discrete: true },
          );
        }
        onSync?.();
        setSynced('synced');
      });

      return ws as unknown as Provider;
    },
    // Intentionally empty: the factory captures `content` at editor-open time,
    // which is what we want for the bootstrap-once-per-session behavior.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return { providerFactory, synced, setSynced };
}
