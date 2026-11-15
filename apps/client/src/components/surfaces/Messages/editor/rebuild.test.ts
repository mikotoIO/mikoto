// @vitest-environment happy-dom
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $getSelection,
  $isParagraphNode,
  $isRangeSelection,
  type LexicalEditor,
  ParagraphNode,
  TextNode,
  createEditor,
} from 'lexical';
import { describe, expect, test } from 'vitest';

import { $wrapSelection } from './MarkdownPreviewPlugin';
import { MESSAGE_EDITOR_NODES, MarkdownTokenNode } from './nodes';
import { $restyleParagraph } from './rebuild';
import type { TokenizeOptions } from './tokenize';

const ID = '3f2a9c1e-0b7d-4c55-9a51-2d4e8f6a7b10';
const opts: TokenizeOptions = {
  isStandardEmoji: (code) => ['smile', '+1'].includes(code),
  customEmojiByName: (name) =>
    name === 'blob' ? { id: ID, name: 'blob' } : undefined,
};

/** A headless composer with the preview transforms, holding `text`. */
function setup(text = '') {
  const editor = createEditor({
    nodes: MESSAGE_EDITOR_NODES,
    onError: (e) => {
      throw e;
    },
  });
  const restyle = (n: ParagraphNode | null) => {
    if ($isParagraphNode(n)) $restyleParagraph(n, opts);
  };
  editor.registerNodeTransform(TextNode, (n) => restyle(n.getParent()));
  editor.registerNodeTransform(MarkdownTokenNode, (n) =>
    restyle(n.getParent()),
  );
  editor.registerNodeTransform(ParagraphNode, restyle);
  editor.update(
    () => {
      const p = $createParagraphNode();
      if (text) p.append($createTextNode(text));
      $getRoot().append(p);
    },
    { discrete: true },
  );
  return editor;
}

function types(editor: LexicalEditor) {
  return editor.getEditorState().read(() =>
    $getRoot()
      .getFirstChildOrThrow<ParagraphNode>()
      .getChildren()
      .map((n) =>
        n instanceof MarkdownTokenNode ? `${n.getKind()}` : n.getType(),
      ),
  );
}

function text(editor: LexicalEditor) {
  return editor.getEditorState().read(() => $getRoot().getTextContent());
}

/** Types `chars` one at a time at the end, like a user would. */
function typeAtEnd(editor: LexicalEditor, chars: string) {
  for (const ch of chars) {
    editor.update(
      () => {
        const p = $getRoot().getFirstChildOrThrow<ParagraphNode>();
        const sel = $getSelection();
        if (!$isRangeSelection(sel)) p.selectEnd();
        const s = $getSelection();
        if ($isRangeSelection(s)) s.insertText(ch);
      },
      { discrete: true },
    );
  }
}

describe('composer preview', () => {
  test('loading a message styles it without changing its text', () => {
    const input = `**hi** @kuroko :smile: <emoji:${ID}:blob>\nline two \`code\``;
    const editor = setup(input);
    expect(text(editor)).toBe(input);
    expect(types(editor)).toEqual([
      'bold',
      'text',
      'mention',
      'text',
      'md-emoji',
      'text',
      'md-emoji',
      'linebreak',
      'text',
      'code',
    ]);
  });

  test('loading never turns a matching :name: into a custom emoji', () => {
    const editor = setup('hi :blob:');
    expect(text(editor)).toBe('hi :blob:');
    expect(types(editor)).toEqual(['text']);
  });

  test('typing styles as you go and keeps the caret at the end', () => {
    const editor = setup();
    typeAtEnd(editor, 'so **cool** :smile: done');
    expect(text(editor)).toBe('so **cool** :smile: done');
    expect(types(editor)).toEqual(['text', 'bold', 'text', 'md-emoji', 'text']);
  });

  test('typing :name: of a custom emoji sends it by id', () => {
    const editor = setup();
    typeAtEnd(editor, 'hi :blob: there');
    expect(text(editor)).toBe(`hi <emoji:${ID}:blob> there`);
    expect(types(editor)).toEqual(['text', 'md-emoji', 'text']);
  });

  test('breaking a token turns it back into text', () => {
    const editor = setup('**bold**');
    editor.update(
      () => {
        const node = $getRoot().getFirstDescendant();
        if (node instanceof TextNode) node.setTextContent('**bold*');
      },
      { discrete: true },
    );
    expect(types(editor)).toEqual(['text']);
  });

  test('Ctrl+B wraps the selection, or leaves the caret between markers', () => {
    const editor = setup();
    typeAtEnd(editor, 'a ');
    editor.update(() => $wrapSelection('**'), { discrete: true });
    typeAtEnd(editor, 'b');
    expect(text(editor)).toBe('a **b**');
    expect(types(editor)).toEqual(['text', 'bold']);
  });
});
