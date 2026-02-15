import {
  findAndReplace,
  type ReplaceFunction,
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
    findAndReplace(tree, [
      [
        /@(\w+)/g,
        (_: string, username: string) =>
          hNode('mention', { username }, `@${username}`),
      ],
    ]);
  };
}

export function remarkEmoji() {
  return (tree: TreeParam) => {
    findAndReplace(tree, [
      [
        /:(\+1|[-\w]+):/g,
        (_: string, emoji: string) =>
          hNode('emoji-shortcode', { emoji }, `:${emoji}:`),
      ],
    ]);
  };
}

export function remarkSpoiler() {
  return (tree: TreeParam) => {
    findAndReplace(tree, [
      [
        /\|\|([\s\S]+?)\|\|(?!\|)/g,
        (_: string, content: string) =>
          hNode('spoiler', { content }, content),
      ],
    ]);
  };
}
