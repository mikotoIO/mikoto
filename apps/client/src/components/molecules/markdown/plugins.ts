import { findAndReplace } from 'mdast-util-find-and-replace';

export function remarkMention() {
  return (tree: any) => {
    findAndReplace(tree, [
      [
        /@(\w+)/g,
        (_: string, username: string) => ({
          type: 'text' as const,
          value: `@${username}`,
          data: {
            hName: 'mention',
            hChildren: [{ type: 'text', value: `@${username}` }],
            hProperties: { username },
          },
        }),
      ],
    ]);
  };
}

export function remarkEmoji() {
  return (tree: any) => {
    findAndReplace(tree, [
      [
        /:(\+1|[-\w]+):/g,
        (_: string, emoji: string) => ({
          type: 'text' as const,
          value: `:${emoji}:`,
          data: {
            hName: 'emoji-shortcode',
            hChildren: [{ type: 'text', value: `:${emoji}:` }],
            hProperties: { emoji },
          },
        }),
      ],
    ]);
  };
}

export function remarkSpoiler() {
  return (tree: any) => {
    findAndReplace(tree, [
      [
        /\|\|([\s\S]+?)\|\|(?!\|)/g,
        (_: string, content: string) => ({
          type: 'text' as const,
          value: content,
          data: {
            hName: 'spoiler',
            hChildren: [{ type: 'text', value: content }],
            hProperties: { content },
          },
        }),
      ],
    ]);
  };
}
