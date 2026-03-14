import { $createCodeNode } from '@lexical/code';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getSelection,
  $isParagraphNode,
  $isRangeSelection,
  $isTextNode,
  COMMAND_PRIORITY_HIGH,
  KEY_ENTER_COMMAND,
} from 'lexical';
import { useEffect } from 'react';

/**
 * Plugin that converts triple backticks (```) into a code block on Enter.
 * The built-in markdown shortcut requires a space after ```, which conflicts
 * with the inline code formatter consuming backticks. This plugin intercepts
 * Enter instead, creating a code block when the line is just ```.
 */
export function CodeBlockPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      KEY_ENTER_COMMAND,
      (event) => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
          return false;
        }

        const anchorNode = selection.anchor.getNode();
        if (!$isTextNode(anchorNode)) {
          return false;
        }

        const parentNode = anchorNode.getParent();
        if (!$isParagraphNode(parentNode)) {
          return false;
        }

        const text = anchorNode.getTextContent();
        const match = text.match(/^```(\w{1,10})?$/);
        if (!match) {
          return false;
        }

        event?.preventDefault();

        const codeNode = $createCodeNode(match[1] || undefined);
        parentNode.replace(codeNode);
        codeNode.selectStart();

        return true;
      },
      COMMAND_PRIORITY_HIGH,
    );
  }, [editor]);

  return null;
}
