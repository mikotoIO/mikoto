import SimpleMarkdown from '@khanacademy/simple-markdown';
import React from 'react';

import { createRule } from '../rules';

const EMOJI_REGEX = /^:(\+1|[-\w]+):/;

const Emoji = React.lazy(() => import('../EmojiElement'));

export const emojiRule = createRule({
  order: SimpleMarkdown.defaultRules.em.order + 1,
  match(source: string) {
    return EMOJI_REGEX.exec(source);
  },
  parse(capture: string[]) {
    return {
      emoji: capture[1],
    };
  },
  react(node, _, state) {
    return <Emoji emoji={node.emoji} key={state.key} />;
  },
});
