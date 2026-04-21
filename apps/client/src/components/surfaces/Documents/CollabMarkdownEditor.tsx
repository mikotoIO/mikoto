import { Box } from '@chakra-ui/react';
import styled from '@emotion/styled';
import { MikotoChannel } from '@mikoto-io/mikoto.js';
import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import { WebsocketProvider } from 'y-websocket';
import * as Y from 'yjs';

import { env } from '@/env';
import { useMikoto } from '@/hooks';

const StyledTextarea = styled.textarea`
  width: 100%;
  min-height: calc(100dvh - 200px);
  background: transparent;
  border: none;
  outline: none;
  resize: none;
  color: inherit;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.95em;
  line-height: 1.5;
  white-space: pre-wrap;
  word-wrap: break-word;
`;

function collabBaseUrl(): string {
  const serverUrl = new URL(env.PUBLIC_SERVER_URL);
  serverUrl.protocol = serverUrl.protocol.replace('http', 'ws');
  return `${serverUrl.origin}/ws/documents`;
}

function diffAndApply(
  ytext: Y.Text,
  previous: string,
  next: string,
  origin: symbol,
) {
  let start = 0;
  const minLen = Math.min(previous.length, next.length);
  while (start < minLen && previous[start] === next[start]) start++;
  let endPrev = previous.length;
  let endNext = next.length;
  while (
    endPrev > start &&
    endNext > start &&
    previous[endPrev - 1] === next[endNext - 1]
  ) {
    endPrev--;
    endNext--;
  }
  const deletedLen = endPrev - start;
  const insertedText = next.slice(start, endNext);
  if (deletedLen === 0 && insertedText.length === 0) return;

  ytext.doc?.transact(() => {
    if (deletedLen > 0) ytext.delete(start, deletedLen);
    if (insertedText.length > 0) ytext.insert(start, insertedText);
  }, origin);
}

type SyncStatus = 'connecting' | 'connected' | 'disconnected';

export function CollabMarkdownEditor({ channel }: { channel: MikotoChannel }) {
  const mikoto = useMikoto();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const localOrigin = useMemo(() => Symbol('mikoto-collab-local'), []);
  const [status, setStatus] = useState<SyncStatus>('connecting');

  const { doc, provider, ytext } = useMemo(() => {
    const doc = new Y.Doc();
    const ytext = doc.getText('markdown');
    const token = mikoto.getAuthToken() ?? '';
    const provider = new WebsocketProvider(collabBaseUrl(), channel.id, doc, {
      params: { token },
    });
    return { doc, provider, ytext };
  }, [channel.id]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return undefined;

    const syncFromYText = () => {
      const value = ytext.toString();
      if (textarea.value !== value) {
        const { selectionStart, selectionEnd } = textarea;
        textarea.value = value;
        // Keep caret within the new bounds.
        const clampedStart = Math.min(selectionStart, value.length);
        const clampedEnd = Math.min(selectionEnd, value.length);
        textarea.setSelectionRange(clampedStart, clampedEnd);
      }
    };

    const observer = (_event: Y.YTextEvent, transaction: Y.Transaction) => {
      if (transaction.origin === localOrigin) return;
      syncFromYText();
    };

    // Seed textarea with whatever state is currently in the Y.Text (possibly
    // empty before the initial server sync lands).
    syncFromYText();
    ytext.observe(observer);

    const onStatus = (payload: { status: string }) => {
      if (payload.status === 'connected') setStatus('connected');
      else if (payload.status === 'disconnected') setStatus('disconnected');
      else setStatus('connecting');
    };
    const onSync = (isSynced: boolean) => {
      if (isSynced) {
        setStatus('connected');
        syncFromYText();
      }
    };

    provider.on('status', onStatus);
    provider.on('sync', onSync);

    return () => {
      ytext.unobserve(observer);
      provider.off('status', onStatus);
      provider.off('sync', onSync);
    };
  }, [provider, ytext, localOrigin]);

  useEffect(() => {
    return () => {
      provider.destroy();
      doc.destroy();
    };
  }, [provider, doc]);

  const onChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const next = event.currentTarget.value;
    const previous = ytext.toString();
    diffAndApply(ytext, previous, next, localOrigin);
  };

  return (
    <Box position="relative">
      {status !== 'connected' && (
        <Box
          position="absolute"
          top={0}
          right={0}
          fontSize="xs"
          color="gray.500"
          pr={2}
        >
          {status === 'connecting' ? 'connecting…' : 'disconnected'}
        </Box>
      )}
      <StyledTextarea
        ref={textareaRef}
        defaultValue={ytext.toString()}
        onChange={onChange}
        spellCheck={false}
      />
    </Box>
  );
}
