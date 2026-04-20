import type { Provider } from '@lexical/yjs';
import { MikotoChannel, MikotoClient } from '@mikoto-io/mikoto.js';
import * as decoding from 'lib0/decoding';
import { WebsocketProvider } from 'y-websocket';
import * as Y from 'yjs';

import { env } from '@/env';

// Custom message tag used by the server to tell exactly one peer per room
// that it has been elected to seed the Y.Doc from Postgres markdown. Must
// match `MSG_BOOTSTRAP_ELECT` in apps/superego/src/routes/channels/documents.rs.
export const MSG_BOOTSTRAP_ELECT = 10;

export type SyncState = 'initial' | 'syncing' | 'synced' | 'error';

export interface BuildProviderOpts {
  channel: MikotoChannel;
  mikoto: MikotoClient;
  onElected: (markdown: string) => void;
}

export function buildProvider(
  id: string,
  yjsDocMap: Map<string, Y.Doc>,
  { channel: _channel, mikoto, onElected }: BuildProviderOpts,
): Provider {
  // Reuse any existing doc in the map. React StrictMode double-invokes this
  // factory; if we minted a fresh Y.Doc each time, the second doc's clientID
  // would not match the binding's captured clientID — and the local user's
  // own awareness entry would slip past Lexical's self-cursor filter and
  // render as a remote presence.
  let doc = yjsDocMap.get(id);
  if (!doc) {
    doc = new Y.Doc();
    yjsDocMap.set(id, doc);
  }

  // `connect: false` is critical: Lexical's CollaborationPlugin attaches
  // observeDeep + onSync + the editor update listener inside a useEffect
  // that runs after this factory. If we let the WebsocketProvider connect
  // immediately (the default), SyncStep2 can land before those listeners
  // are wired up — Y.applyUpdate populates the Y.Doc silently, the Lexical
  // tree ends up empty, and subsequent remote updates then throw
  // "could not find element node". Lexical's effect calls provider.connect()
  // itself, so deferring is safe.
  const ws = new WebsocketProvider(env.PUBLIC_COLLABORATION_URL, id, doc, {
    params: { token: mikoto.getAccessToken() ?? '' },
    connect: false,
  });

  // Register a handler for the server's bootstrap-election message. The
  // server sends this exactly once per Room lifetime to the peer that won
  // `AtomicBool::compare_exchange(false, true)`. Other peers never receive
  // it and must therefore NOT run the markdown bootstrap. The payload is
  // the canonical markdown from Postgres at the moment of election — we
  // seed from that rather than a React prop so we're always in sync with
  // the database even across reconnects and room re-creations.
  const decoder = new TextDecoder();
  const wsAny = ws as unknown as {
    messageHandlers: Array<unknown>;
  };
  wsAny.messageHandlers[MSG_BOOTSTRAP_ELECT] = (
    _encoder: unknown,
    msgDecoder: decoding.Decoder,
  ) => {
    const bytes = decoding.readVarUint8Array(msgDecoder);
    const markdown = decoder.decode(bytes);
    onElected(markdown);
  };

  return ws as unknown as Provider;
}
