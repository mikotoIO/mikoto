import { TextMatchTransformer, TRANSFORMERS } from '@lexical/markdown';

import {
  $createImageNode,
  $isImageNode,
  ImageNode,
} from './nodes/ImageNode';

export const IMAGE: TextMatchTransformer = {
  dependencies: [ImageNode],
  export: (node) => {
    if (!$isImageNode(node)) return null;
    return `![${node.getAltText()}](${node.getSrc()})`;
  },
  importRegExp: /!\[([^\]]*)\]\(([^)]+)\)/,
  regExp: /!\[([^\]]*)\]\(([^)]+)\)$/,
  replace: (textNode, match) => {
    const [, altText, src] = match;
    const imageNode = $createImageNode(src, altText);
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
export const DOCUMENT_TRANSFORMERS = [IMAGE, ...TRANSFORMERS];
