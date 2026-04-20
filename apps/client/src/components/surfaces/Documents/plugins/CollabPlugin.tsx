import {
  $convertFromMarkdownString,
  TRANSFORMERS,
} from '@lexical/markdown';
import { CollaborationContext } from '@lexical/react/LexicalCollaborationContext';
import { CollaborationPlugin } from '@lexical/react/LexicalCollaborationPlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { MikotoChannel } from '@mikoto-io/mikoto.js';
import { useCallback, useMemo, useRef } from 'react';
import type * as Y from 'yjs';

import { useMikoto } from '@/hooks';

import { buildProvider, SyncState } from '../providerFactory';

export interface CollabPluginProps {
  channel: MikotoChannel;
}

// Lexical's built-in `shouldBootstrap`/`initialEditorState` path is unsafe
// with multiple peers: both peers that connect to a freshly-created room
// observe `root._xmlText._length === 0` at sync time and both run
// $convertFromMarkdownString, which produces two independent sets of Yjs
// items that the CRDT then merges into duplicated content. The server picks
// exactly one peer via an atomic compare_exchange and notifies it with a
// custom message; this plugin runs the seed in response.
export function CollabPlugin({ channel }: CollabPluginProps) {
  const mikoto = useMikoto();
  const [editor] = useLexicalComposerContext();

  const seededRef = useRef(false);

  // The server sends the authoritative Postgres markdown as the election
  // payload. We seed from that, not from a React prop, so we're guaranteed
  // to be in sync with the DB even across StrictMode remounts and room
  // re-creations — both of which can cause the client to re-elect.
  const onElected = useCallback(
    (markdown: string) => {
      if (seededRef.current) return;
      seededRef.current = true;
      editor.update(
        () => {
          $convertFromMarkdownString(markdown, TRANSFORMERS);
        },
        { tag: 'history-merge' },
      );
    },
    [editor],
  );

  // Stable factory: only recreated if channel id or the mikoto client change.
  // CollaborationPlugin's provider useMemo depends on `providerFactory`, so
  // a stable reference is required to avoid tearing the Yjs binding down on
  // every re-render.
  const providerFactory = useCallback(
    (id: string, yjsDocMap: Map<string, Y.Doc>) =>
      buildProvider(id, yjsDocMap, { channel, mikoto, onElected }),
    [channel, mikoto, onElected],
  );

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

export type { SyncState };
