import {
  type ReplaceFunction,
  findAndReplace,
} from 'mdast-util-find-and-replace';

type TreeParam = Parameters<typeof findAndReplace>[0];

function hNode(
  tagName: string,
  properties: Record<string, string>,
  value: string,
): ReturnType<ReplaceFunction> {
  return {
    type: 'text',
    value,
    data: {
      hName: tagName,
      hChildren: [{ type: 'text', value }],
      hProperties: properties,
    },
  };
}

export function remarkMention() {
  return (tree: TreeParam) => {
    findAndReplace(
      tree,
      [
        [
          /@([\w.]+)/g,
          (_: string, username: string) =>
            hNode('mention', { username }, `@${username}`),
        ],
      ],
      { ignore: ['link', 'linkReference'] },
    );
  };
}

export function remarkEmoji() {
  return (tree: TreeParam) => {
    findAndReplace(
      tree,
      [
        [
          /:(\+1|[-\w]+):/g,
          (_: string, emoji: string) =>
            hNode('emoji-shortcode', { emoji }, `:${emoji}:`),
        ],
      ],
      { ignore: ['link', 'linkReference'] },
    );
  };
}

export function remarkSpoiler() {
  return (tree: TreeParam) => {
    findAndReplace(
      tree,
      [
        [
          /\|\|([\s\S]+?)\|\|(?!\|)/g,
          (_: string, content: string) =>
            hNode('spoiler', { content }, content),
        ],
      ],
      { ignore: ['link', 'linkReference'] },
    );
  };
}

// Zero-width non-joiner used as escape placeholder
const ESCAPE_PLACEHOLDER = '\u200C';

// Matches code blocks/inline code (preserved as-is) or our custom escape sequences
const ESCAPE_PREPROCESS_REGEX =
  /(```[\s\S]*?```|~~~[\s\S]*?~~~|`[^`\n]+`)|(?<!\\)\\(\|\|)|(?<!\\)\\(@[\w.]*|:)/g;

/**
 * Pre-processes a markdown string so that \@, \:, and \|| escape sequences
 * are not matched by the custom remark plugins. Must be called on the raw
 * string before passing it to react-markdown.
 */
export function preprocessEscapes(content: string): string {
  return content.replace(
    ESCAPE_PREPROCESS_REGEX,
    (_match, codeBlock: string, spoilerEsc: string, charEsc: string) => {
      if (codeBlock) return codeBlock;
      if (spoilerEsc) return `|${ESCAPE_PLACEHOLDER}|`;
      if (charEsc) return charEsc + ESCAPE_PLACEHOLDER;
      return _match;
    },
  );
}

/**
 * Remark plugin that strips escape placeholder characters from text nodes.
 * Must run after the custom plugins (remarkMention, remarkEmoji, remarkSpoiler).
 */
export function remarkCleanEscapes() {
  function visit(node: { type: string; value?: string; children?: any[] }) {
    if (node.type === 'text' && typeof node.value === 'string') {
      node.value = node.value.replaceAll(ESCAPE_PLACEHOLDER, '');
    }
    if (node.children) {
      for (const child of node.children) {
        visit(child);
      }
    }
  }
  return (tree: TreeParam) => {
    visit(tree);
  };
}
