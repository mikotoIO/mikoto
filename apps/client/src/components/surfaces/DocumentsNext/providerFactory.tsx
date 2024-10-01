import { HocuspocusProvider } from '@hocuspocus/provider';
import {
  $convertFromMarkdownString,
  $convertToMarkdownString,
  TRANSFORMERS,
} from '@lexical/markdown';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { MikotoChannel } from '@mikoto-io/mikoto.js';
import { useCallback, useState } from 'react';
import * as Y from 'yjs';

import { env } from '@/env';
import { useMikoto } from '@/hooks';

export interface UseProviderFactoryProps {
  channel: MikotoChannel;
  content: string;
  onSync?: () => void;
}

export type SyncState = 'initial' | 'synced' | 'syncing' | 'error';

export function useProviderFactory({
  channel,
  content,
  onSync,
}: UseProviderFactoryProps) {
  const mikoto = useMikoto();
  const [synced, setSynced] = useState<SyncState>('initial');
  // const [changed, setChanged] = useState(false);
  const [editor] = useLexicalComposerContext();
  const [editorContent, setEditorContent] = useState(content);

  const providerFactory = useCallback(
    (id: string, yjsDocMap: Map<string, Y.Doc>) => {
      const doc = new Y.Doc();
      yjsDocMap.set(id, doc);

      const hocuspocus = new HocuspocusProvider({
        url: env.PUBLIC_COLLABORATION_URL,
        name: channel.id,
        document: doc,
      });

      hocuspocus.on('synced', () => {
        if (doc.store.clients.size === 0) {
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

      return hocuspocus as any;
    },
    [],
  );

  const save = () => {
    const contentString = editor
      .getEditorState()
      .read(() => $convertToMarkdownString(TRANSFORMERS));

    mikoto.rest['documents.update'](
      { content: contentString },
      {
        params: {
          spaceId: channel.spaceId,
          channelId: channel.id,
        },
      },
    )
      .then(() => setSynced('synced'))
      .catch((e) => {
        console.error(e);
        setSynced('error');
      });
  };

  return { providerFactory, synced, setSynced, save };
}
