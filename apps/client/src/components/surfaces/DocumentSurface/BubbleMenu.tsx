import { Box, chakra } from '@chakra-ui/react';
import styled from '@emotion/styled';
import {
  faBold,
  faItalic,
  faStrikethrough,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { BubbleMenu, Editor } from '@tiptap/react';

const BubbleButton = chakra('button', {
  baseStyle: {
    background: 'none',
    color: 'gray.500',
    fontSize: '16px',
    _hover: { color: 'white' },
  },
});

export function NoteBubbleMenu({ editor }: { editor: Editor }) {
  return (
    <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }}>
      <Box
        p={1}
        borderRadius="md"
        backgroundColor="gray.800"
        border="1px solid"
        borderColor="gray.600"
      >
        <BubbleButton
          type="button"
          onClick={() => {
            editor.chain().focus().toggleMark('bold').run();
          }}
        >
          <FontAwesomeIcon icon={faBold} />
        </BubbleButton>
        <BubbleButton
          type="button"
          onClick={() => {
            editor.chain().focus().toggleMark('italic').run();
          }}
        >
          <FontAwesomeIcon icon={faItalic} />
        </BubbleButton>
        <BubbleButton
          type="button"
          onClick={() => {
            editor.chain().focus().toggleMark('strike').run();
          }}
        >
          <FontAwesomeIcon icon={faStrikethrough} />
        </BubbleButton>
      </Box>
    </BubbleMenu>
  );
}
