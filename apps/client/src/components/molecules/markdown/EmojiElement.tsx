import emojiData from '@emoji-mart/data/sets/14/twitter.json';
import { init } from 'emoji-mart';

import { FloatingTooltip } from '@/ui';

init({ data: emojiData });

export default function Emoji({ emoji }: { emoji: string }) {
  return (
    <FloatingTooltip
      tooltip={`:${emoji}:`}
      placement="top"
      offsetOptions={[0, 32]}
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
    </FloatingTooltip>
  );
}
