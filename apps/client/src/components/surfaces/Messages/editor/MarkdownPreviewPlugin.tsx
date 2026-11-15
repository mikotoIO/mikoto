import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { mergeRegister } from '@lexical/utils';
import {
  $getRoot,
  $getSelection,
  $isParagraphNode,
  $isRangeSelection,
  $isTextNode,
  COMMAND_PRIORITY_LOW,
  FORMAT_TEXT_COMMAND,
  type LexicalNode,
  ParagraphNode,
  type TextFormatType,
  TextNode,
} from 'lexical';
import { useEffect, useRef } from 'react';

import { useCustomEmojis } from '@/components/molecules/markdown';

import { useEmojiSet } from '../emojiData';
import { MarkdownTokenNode } from './nodes';
import { $restyleParagraph } from './rebuild';
import type { TokenizeOptions } from './tokenize';

/** Ctrl/Cmd+B and +I wrap the selection in markdown. */
const SHORTCUT_MARKERS: Partial<Record<TextFormatType, string>> = {
  bold: '**',
  italic: '*',
  strikethrough: '~~',
  code: '`',
};

/** Wraps the selection in `marker`, or puts the caret between a pair. */
export function $wrapSelection(marker: string) {
  const selection = $getSelection();
  if (!$isRangeSelection(selection)) return;
  const text = selection.getTextContent();
  selection.insertText(`${marker}${text}${marker}`);
  if (text) return;
  // Step back inside the pair.
  const { anchor } = selection;
  const node = anchor.getNode();
  if ($isTextNode(node) && anchor.offset >= marker.length) {
    const offset = anchor.offset - marker.length;
    selection.setTextNodeRange(node, offset, node, offset);
  }
}

/**
 * Live markdown preview for the composer: styles `**bold**`, mentions,
 * links and code in place, and shows emoji as images, while the text stays
 * the exact markdown that will be sent.
 */
export function MarkdownPreviewPlugin() {
  const [editor] = useLexicalComposerContext();
  const custom = useCustomEmojis();
  const standard = useEmojiSet();

  const optsRef = useRef<TokenizeOptions>({});
  optsRef.current = {
    isStandardEmoji: (code) => !!standard?.byId.has(code),
    customEmojiByName: (name) => custom.byName.get(name.toLowerCase()),
  };

  useEffect(() => {
    const restyle = (node: LexicalNode | null) => {
      // Rewriting nodes mid-composition breaks IME input; the update that
      // ends the composition restyles.
      if (editor.isComposing()) return;
      if ($isParagraphNode(node)) $restyleParagraph(node, optsRef.current);
    };
    return mergeRegister(
      editor.registerNodeTransform(TextNode, (n) => restyle(n.getParent())),
      editor.registerNodeTransform(MarkdownTokenNode, (n) =>
        restyle(n.getParent()),
      ),
      // Removing an emoji or line break only marks the paragraph.
      editor.registerNodeTransform(ParagraphNode, restyle),
      editor.registerCommand(
        FORMAT_TEXT_COMMAND,
        (format) => {
          const marker = SHORTCUT_MARKERS[format];
          if (marker) $wrapSelection(marker);
          // Plain markdown only: never apply rich-text formats.
          return true;
        },
        COMMAND_PRIORITY_LOW,
      ),
    );
  }, [editor]);

  // Emoji data arrives after the text may already be there; restyle then.
  useEffect(() => {
    editor.update(() => {
      for (const node of $getRoot().getChildren()) node.markDirty();
    });
  }, [editor, standard, custom]);

  return null;
}
