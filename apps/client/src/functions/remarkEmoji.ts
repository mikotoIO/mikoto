import { nameToEmoji } from 'gemoji';
import { findAndReplace } from 'mdast-util-find-and-replace';
import { Plugin } from 'unified';

const REGEX = /:(\+1|[-\w]+):/gi;

export function remarkEmoji(): Plugin {
  return (tree) => {
    findAndReplace(tree, REGEX, (all, text) => {
      if (nameToEmoji[text]) {
        const url = `https://abs.twimg.com/emoji/v2/svg/${nameToEmoji[text]
          .codePointAt(0)
          ?.toString(16)}.svg`;

        return {
          type: 'image',
          url,
          data: {
            hName: 'img',
            hProperties: {
              className: 'emoji',
            },
          },
        };
      }
      if (text === 'derp') {
        // placeholder, in-production, it should check for URLlikes
        return {
          type: 'image',
          url: 'https://cdn.discordapp.com/emojis/658370019071229991.webp?size=128&quality=lossless',
          data: {
            hName: 'img',
            hProperties: {
              className: 'emoji',
            },
          },
        };
      }
      return all;
    });
  };
}
