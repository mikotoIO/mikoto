import {
  $convertFromMarkdownString,
  TRANSFORMERS,
} from '@lexical/markdown';
import { CollaborationContext } from '@lexical/react/LexicalCollaborationContext';
import { CollaborationPlugin } from '@lexical/react/LexicalCollaborationPlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { MikotoChannel } from '@mikoto-io/mikoto.js';
import { useEffect, useMemo, useRef } from 'react';

import { useMikoto } from '@/hooks';

import { SyncState, useProviderFactory } from '../providerFactory';

// Lexical's built-in `shouldBootstrap`/`initialEditorState` path is unsafe
// with multiple peers: both peers that connect to a freshly-created room
// observe `root._xmlText._length === 0` at sync time and both run
// $convertFromMarkdownString, which produces two independent sets of Yjs
// items that the CRDT then merges into duplicated content. The server picks
// exactly one peer via an atomic compare_exchange and notifies it with a
// custom message; this plugin runs the seed in response.
export function CollabPlugin({ channel, content }: CollabPluginProps) {
  const mikoto = useMikoto();
  const [editor] = useLexicalComposerContext();
  const { providerFactory, providerRef } = useProviderFactory({ channel });

  // Isolate each editor instance's CollaborationContext. The default export
  // from @lexical/react is a module-level singleton with a shared yjsDocMap;
  // two editors for the same channel (e.g. two dockview panels) would share
  // a Y.Doc, and the second's observeDeep would subscribe after the doc was
  // already populated, so it would never see initial content as an event.
  const collabContext = useMemo(
    () => ({
      clientID: 0,
      color: '#00ffff',
      isCollabActive: false,
      name: mikoto.user.me?.name ?? 'anonymous',
      yjsDocMap: new Map(),
    }),
    [mikoto],
  );

  // Seed the Y.Doc from markdown exactly once, and only if the server
  // elected us. The provider emits `bootstrap-elect` when the custom
  // message arrives; we hook it in an effect and run $convertFromMarkdownString
  // inside an editor.update tagged `history-merge` so it mirrors through to
  // the Yjs binding without being treated as a remote collab update.
  const seededRef = useRef(false);
  useEffect(() => {
    const provider = providerRef.current;
    if (!provider) return;

    const onBootstrap = () => {
      if (seededRef.current) return;
      seededRef.current = true;
      editor.update(
        () => {
          $convertFromMarkdownString(content, TRANSFORMERS);
        },
        { tag: 'history-merge' },
      );
    };

    provider.on('bootstrap-elect', onBootstrap);
    return () => {
      provider.off('bootstrap-elect', onBootstrap);
    };
  }, [editor, content, providerRef]);

  return (
    <CollaborationContext.Provider value={collabContext}>
      <CollaborationPlugin
        id={channel.id}
        providerFactory={providerFactory}
        // We handle bootstrap ourselves above, gated on the server's
        // election. Lexical's built-in path can't be used safely here.
        shouldBootstrap={false}
        username={mikoto.user.me?.name}
      />
    </CollaborationContext.Provider>
  );
}

export interface CollabPluginProps {
  channel: MikotoChannel;
  content: string;
}

export type { SyncState };
