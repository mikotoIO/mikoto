import { nameToEmoji } from 'gemoji';
import { findAndReplace } from 'mdast-util-find-and-replace';
import { Plugin } from 'unified';

const REGEX = /:(\+1|[-\w]+):/gi;

export function remarkEmoji(): Plugin {
  return (tree) => {
    findAndReplace(tree, REGEX, (all, text) => {
      if (nameToEmoji[text]) {
        // const p = twemoji.parse(nameToEmoji[text]);
        // console.log(p);

        return {
          type: 'text',
          data: {
            hName: 'span',
            hProperties: {
              role: 'img',
              ariaLabel: text,
            },
            hChildren: [{ type: 'text', value: nameToEmoji[text] }],
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
