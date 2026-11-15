import {
  $createLineBreakNode,
  $createTextNode,
  $getSelection,
  $isLineBreakNode,
  $isRangeSelection,
  $isTextNode,
  type ElementNode,
  type LexicalNode,
  type PointType,
} from 'lexical';

import {
  $createEmojiNode,
  $createMarkdownTokenNode,
  $isEmojiNode,
  $isMarkdownTokenNode,
} from './nodes';
import { type Segment, type TokenizeOptions, tokenize } from './tokenize';

function size(node: LexicalNode) {
  return node.getTextContentSize();
}

function sumSizes(nodes: LexicalNode[]) {
  return nodes.reduce((n, node) => n + size(node), 0);
}

/** Where a selection point is, as a character offset into `parent`'s text. */
function pointOffset(
  point: PointType,
  parent: ElementNode,
  children: LexicalNode[],
): number | null {
  const node = point.getNode();
  if (point.type === 'element') {
    return node.is(parent) ? sumSizes(children.slice(0, point.offset)) : null;
  }
  const index = children.findIndex((c) => c.is(node));
  if (index === -1) return null;
  return sumSizes(children.slice(0, index)) + point.offset;
}

/** Puts a point back at a character offset into `parent`'s text. */
function setPointAt(point: PointType, offset: number, parent: ElementNode) {
  const children = parent.getChildren();
  let pos = 0;
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    const end = pos + size(child);
    if ($isTextNode(child)) {
      if (offset <= end) {
        point.set(child.getKey(), offset - pos, 'text');
        return;
      }
    } else if (offset < end) {
      // Never inside an emoji or line break: just before or after it.
      point.set(parent.getKey(), offset <= pos ? i : i + 1, 'element');
      return;
    }
    pos = end;
  }
  point.set(parent.getKey(), children.length, 'element');
}

function matches(node: LexicalNode, segment: Segment): boolean {
  switch (segment.type) {
    case 'text':
      return (
        $isTextNode(node) &&
        node.getType() === 'text' &&
        node.getFormat() === 0 &&
        node.getTextContent() === segment.text
      );
    case 'mark':
      return (
        $isMarkdownTokenNode(node) &&
        node.getKind() === segment.kind &&
        node.getTextContent() === segment.text
      );
    case 'emoji':
      return $isEmojiNode(node) && node.getSource() === segment.text;
    case 'break':
      return $isLineBreakNode(node);
  }
}

function create(segment: Segment): LexicalNode {
  switch (segment.type) {
    case 'text':
      return $createTextNode(segment.text);
    case 'mark':
      return $createMarkdownTokenNode(segment.kind, segment.text);
    case 'emoji':
      return $createEmojiNode(segment.text);
    case 'break':
      return $createLineBreakNode();
  }
}

/**
 * Re-segments a paragraph's markdown into styled nodes, keeping the
 * selection where it was in the text. Does nothing if the nodes are already
 * right, so it can run from transforms without looping.
 */
export function $restyleParagraph(
  paragraph: ElementNode,
  opts: TokenizeOptions,
) {
  const children = paragraph.getChildren();
  const text = children.map((c) => c.getTextContent()).join('');

  const selection = $getSelection();
  let anchor: number | null = null;
  let focus: number | null = null;
  if ($isRangeSelection(selection)) {
    anchor = pointOffset(selection.anchor, paragraph, children);
    focus = pointOffset(selection.focus, paragraph, children);
  }
  const caret =
    anchor !== null && anchor === focus && $isRangeSelection(selection)
      ? anchor
      : null;

  const segments = tokenize(text, { ...opts, caret });
  if (
    segments.length === children.length &&
    segments.every((s, i) => matches(children[i], s))
  ) {
    return;
  }

  paragraph.splice(0, children.length, segments.map(create));

  if ($isRangeSelection(selection) && anchor !== null && focus !== null) {
    // A typed `:name:` that became an emoji object grew; land after it.
    const grown = sumSizes(paragraph.getChildren()) - text.length;
    const shift = (n: number) => (caret !== null && n >= caret ? n + grown : n);
    setPointAt(selection.anchor, shift(anchor), paragraph);
    setPointAt(selection.focus, shift(focus), paragraph);
  }
}
