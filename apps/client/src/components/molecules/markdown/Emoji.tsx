import SimpleMarkdown from '@khanacademy/simple-markdown';
import Tippy from '@tippyjs/react';

import { Tooltip } from '../../atoms/Tooltip';
import { createRule } from './rules';

const EMOJI_REGEX = /^:(\+1|[-\w]+):/;

function Emoji({ emoji }: { emoji: string }) {
  return (
    <Tippy
      animation={false}
      content={<Tooltip>:{emoji}:</Tooltip>}
      placement="top"
      offset={[0, 32]}
    >
      {/* @ts-expect-error 2339 */}
      <em-emoji
        id={emoji}
        className="emoji"
        set="twitter"
        size="1.2em"
        fallback={`:${emoji}:`}
        style={{ verticalAlign: 'middle' }}
      />
    </Tippy>
  );
}

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
