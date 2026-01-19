import { $convertFromMarkdownString, TRANSFORMERS } from '@lexical/markdown';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getRoot,
  $getSelection,
  $insertNodes,
  $isRangeSelection,
  COMMAND_PRIORITY_HIGH,
  PASTE_COMMAND,
} from 'lexical';
import { useEffect } from 'react';

// Patterns that indicate markdown content
const MARKDOWN_PATTERNS = [
  /^#{1,6}\s/, // Headers
  /\*\*[^*]+\*\*/, // Bold
  /\*[^*]+\*/, // Italic (single asterisk)
  /_[^_]+_/, // Italic (underscore)
  /`[^`]+`/, // Inline code
  /```[\s\S]*```/, // Code blocks
  /^\s*[-*+]\s/, // Unordered lists
  /^\s*\d+\.\s/, // Ordered lists
  /\[.+\]\(.+\)/, // Links
  /^>\s/, // Blockquotes
  /^---\s*$/, // Horizontal rule
  /^\*\*\*\s*$/, // Horizontal rule (asterisks)
];

export function MarkdownPastePlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(
    () =>
      editor.registerCommand(
        PASTE_COMMAND,
        (event: ClipboardEvent) => {
          const clipboardData = event.clipboardData;
          if (!clipboardData) return false;

          // Check if there's HTML content - if so, let the default handler deal with it
          const htmlData = clipboardData.getData('text/html');
          if (htmlData) return false;

          const textData = clipboardData.getData('text/plain');
          if (!textData) return false;

          event.preventDefault();

          editor.update(() => {
            const selection = $getSelection();

            if ($isRangeSelection(selection)) {
              // Remove selected content if any
              selection.removeText();

              const root = $getRoot();

              // Save the current root state
              const savedChildren = root.getChildren();

              // Clear root and parse markdown into it
              root.clear();
              $convertFromMarkdownString(textData, TRANSFORMERS);

              // Get the parsed nodes
              const parsedNodes = root.getChildren();

              // Restore original content
              root.clear();
              savedChildren.forEach((child) => root.append(child));

              // Insert the parsed nodes at the selection
              if (parsedNodes.length > 0) {
                $insertNodes(parsedNodes);
              }
            }
          });

          return true;
        },
        COMMAND_PRIORITY_HIGH,
      ),
    [editor],
  );

  return null;
}
