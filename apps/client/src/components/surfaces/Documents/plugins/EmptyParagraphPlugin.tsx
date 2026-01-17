import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getSelection,
  $isParagraphNode,
  $isRangeSelection,
  COMMAND_PRIORITY_LOW,
  KEY_BACKSPACE_COMMAND,
} from 'lexical';
import { useEffect } from 'react';

const ZERO_WIDTH_SPACE = '\u200B';

/**
 * Plugin that handles backspace on paragraphs containing only zero-width spaces.
 * This allows single-backspace deletion of placeholder empty paragraphs used
 * to preserve multiple line breaks in markdown.
 */
export function EmptyParagraphPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      KEY_BACKSPACE_COMMAND,
      (event) => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
          return false;
        }

        const anchorNode = selection.anchor.getNode();
        const parentNode = anchorNode.getParent();

        // Check if we're in a paragraph
        if (!$isParagraphNode(parentNode)) {
          return false;
        }

        // Check if the paragraph only contains zero-width space(s)
        const textContent = parentNode.getTextContent();
        if (
          textContent.replace(new RegExp(ZERO_WIDTH_SPACE, 'g'), '').length > 0
        ) {
          return false;
        }

        // Check if there's a previous sibling to move cursor to
        const prevSibling = parentNode.getPreviousSibling();
        if (!prevSibling) {
          return false;
        }

        event?.preventDefault();

        // Remove the ZWS paragraph and move selection to end of previous sibling
        parentNode.remove();
        prevSibling.selectEnd();

        return true;
      },
      COMMAND_PRIORITY_LOW,
    );
  }, [editor]);

  return null;
}
