import { $convertToMarkdownString, TRANSFORMERS } from '@lexical/markdown';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { MikotoChannel } from '@mikoto-io/mikoto.js';
import { COMMAND_PRIORITY_NORMAL, KEY_DOWN_COMMAND } from 'lexical';
import { useEffect } from 'react';
import { toast } from 'react-toastify';

export function saveWithToast(channel: MikotoChannel, content: string) {
  const promise = channel.client.rest['documents.update'](
    { content },
    {
      params: {
        spaceId: channel.spaceId,
        channelId: channel.id,
      },
    },
  );
  toast.promise(promise, {
    pending: 'Saving...',
    success: 'Saved!',
    error: 'Failed to save :(',
  });
}

export function HotkeyPlugin({ channel }: { channel: MikotoChannel }) {
  const [editor] = useLexicalComposerContext();

  const COMMAND_MAP: Record<string, (event: KeyboardEvent) => boolean> = {
    s: (event) => {
      event.preventDefault();
      const content = $convertToMarkdownString(TRANSFORMERS);
      saveWithToast(channel, content);
      return false;
    },
  };

  useEffect(
    () =>
      editor.registerCommand(
        KEY_DOWN_COMMAND,
        (event) => {
          if (!event.ctrlKey) return false;
          const command = COMMAND_MAP[event.key];
          if (command) return command(event);
          return false;
        },
        COMMAND_PRIORITY_NORMAL,
      ),
    [editor],
  );
  return <></>;
}
