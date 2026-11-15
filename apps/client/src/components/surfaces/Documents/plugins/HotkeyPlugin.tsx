import { $convertToMarkdownString } from '@lexical/markdown';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { MikotoChannel } from '@mikoto-io/mikoto.js';
import { COMMAND_PRIORITY_NORMAL, KEY_DOWN_COMMAND } from 'lexical';
import { useEffect, useRef } from 'react';

import { describeError, toast } from '@/design';

import { DOCUMENT_TRANSFORMERS } from '../transformers';

async function saveWithToast(channel: MikotoChannel, content: string) {
  if (!channel.spaceId) return;
  const id = toast({ type: 'loading', title: 'Saving doc…' });
  try {
    await channel.client.rest['documents.update'](
      { content },
      {
        params: {
          spaceId: channel.spaceId,
          channelId: channel.id,
        },
      },
    );
    toast.update(id, { type: 'success', title: 'Doc saved' });
  } catch (err) {
    toast.update(id, {
      type: 'error',
      title: "Couldn't save the doc",
      description: `${describeError(err, { context: 'action' }).message} Your edits are still here.`,
    });
  }
}

/** Ctrl/Cmd+S saves the doc right away instead of waiting for autosave. */
export function HotkeyPlugin({ channel }: { channel: MikotoChannel }) {
  const [editor] = useLexicalComposerContext();
  const channelRef = useRef(channel);
  channelRef.current = channel;

  useEffect(
    () =>
      editor.registerCommand(
        KEY_DOWN_COMMAND,
        (event) => {
          if (!(event.ctrlKey || event.metaKey) || event.key !== 's') {
            return false;
          }
          event.preventDefault();
          // Same conversion as autosave, so checklists, images and blank
          // lines round-trip identically.
          const content = $convertToMarkdownString(
            DOCUMENT_TRANSFORMERS,
            undefined,
            true,
          );
          void saveWithToast(channelRef.current, content);
          return true;
        },
        COMMAND_PRIORITY_NORMAL,
      ),
    [editor],
  );
  return null;
}
