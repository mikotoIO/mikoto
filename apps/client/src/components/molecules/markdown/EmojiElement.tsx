import Tippy from '@tippyjs/react';

import { Tooltip } from '@/ui';

import '../../surfaces/messages/EmojiPicker';

export default function Emoji({ emoji }: { emoji: string }) {
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
