import { $convertToMarkdownString, TRANSFORMERS } from '@lexical/markdown';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { MikotoChannel } from '@mikoto-io/mikoto.js';
import { COMMAND_PRIORITY_NORMAL, KEY_DOWN_COMMAND } from 'lexical';
import { useEffect } from 'react';

import { useMikoto } from '@/hooks';

export function SaveLoadPlugin({ channel }: { channel: MikotoChannel }) {
  const [editor] = useLexicalComposerContext();
  const mikoto = useMikoto();
  useEffect(() => {
    return editor.registerCommand(
      KEY_DOWN_COMMAND,
      (event) => {
        // check if key is ctrl + s
        if (event && event.ctrlKey && event.key === 's') {
          const content = $convertToMarkdownString(TRANSFORMERS);
          mikoto.rest['documents.update'](
            {
              content,
            },
            {
              params: {
                spaceId: channel.spaceId,
                channelId: channel.id,
              },
            },
          );

          event.preventDefault();
        }
        return false;
      },
      COMMAND_PRIORITY_NORMAL,
    );
  }, [editor]);
  return <></>;
}
