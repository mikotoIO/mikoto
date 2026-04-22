import {
  CHECK_LIST,
  TextMatchTransformer,
  TRANSFORMERS,
} from '@lexical/markdown';

import {
  $createImageNode,
  $isImageNode,
  ImageNode,
} from './nodes/ImageNode';

// Obsidian-style image syntax: `![alt|WIDTH](src)` or
// `![alt|WIDTHxHEIGHT](src)`. Height is parsed but ignored — resize locks
// aspect ratio, so only width is authoritative. The `|` acts as a delimiter
// between alt text and dimensions, so alt text itself cannot contain `|`.
const IMAGE_PATTERN = /!\[([^\]|]*)(?:\|(\d+)(?:x\d+)?)?\]\(([^)\s]+)\)/;
const IMAGE_PATTERN_END = /!\[([^\]|]*)(?:\|(\d+)(?:x\d+)?)?\]\(([^)\s]+)\)$/;

export const IMAGE: TextMatchTransformer = {
  dependencies: [ImageNode],
  export: (node) => {
    if (!$isImageNode(node)) return null;
    const width = node.getWidth();
    const suffix = width ? `|${Math.round(width)}` : '';
    return `![${node.getAltText()}${suffix}](${node.getSrc()})`;
  },
  importRegExp: IMAGE_PATTERN,
  regExp: IMAGE_PATTERN_END,
  replace: (textNode, match) => {
    const [, altText, widthStr, src] = match;
    const width = widthStr ? parseInt(widthStr, 10) : undefined;
    const imageNode = $createImageNode(src, altText, width);
    textNode.replace(imageNode);
  },
  trigger: ')',
  type: 'text-match',
};

// IMAGE must come before LINK in the text-match transformer list. Lexical's
// `findOutermostTextMatchTransformer` picks the earliest-start match and only
// swaps to a wider one if `endIndex > existingEnd`. `![alt](url)` and
// `[alt](url)` end at the same index, so a later-iterated IMAGE cannot
// displace a first-matched LINK — we have to iterate IMAGE first.
//
// CHECK_LIST must come before the default TRANSFORMERS because UNORDERED_LIST's
// regex `^(\s*)[-*+]\s/` would otherwise swallow the `- ` prefix of a `- [x]`
// line before the stricter check-list regex got a chance to match.
export const DOCUMENT_TRANSFORMERS = [IMAGE, CHECK_LIST, ...TRANSFORMERS];
