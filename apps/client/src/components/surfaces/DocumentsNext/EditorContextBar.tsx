import { Flex, Spinner } from '@chakra-ui/react';
import { faEllipsis, faSquareCheck } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { $convertToMarkdownString, TRANSFORMERS } from '@lexical/markdown';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { toast } from 'react-toastify';

import { ContextMenu, useContextMenuX } from '@/components/ContextMenu';

import { SyncState } from './providerFactory';

export interface EditorContextBarProps {
  syncState: SyncState;
}

export function EditorContextBar({ syncState }: EditorContextBarProps) {
  const contextMenu = useContextMenuX();
  const [editor] = useLexicalComposerContext();

  return (
    <Flex
      w="100%"
      h={8}
      bg="gray.800"
      rounded="md"
      px={4}
      mb={4}
      align="center"
      justify="space-between"
    >
      <FontAwesomeIcon
        icon={faEllipsis}
        onClick={contextMenu(() => (
          <ContextMenu>
            <ContextMenu.Link
              onClick={() => {
                if (!editor) return;
                const text = editor
                  .getEditorState()
                  .read(() => $convertToMarkdownString(TRANSFORMERS));
                navigator.clipboard.writeText(text);
                toast('Copied Markdown to clipboard');
              }}
            >
              Copy Markdown
            </ContextMenu.Link>
          </ContextMenu>
        ))}
      />
      <Flex gap={2}>
        {syncState === 'syncing' ? (
          <Spinner size="xs" />
        ) : (
          <FontAwesomeIcon icon={faSquareCheck} />
        )}
      </Flex>
    </Flex>
  );
}
