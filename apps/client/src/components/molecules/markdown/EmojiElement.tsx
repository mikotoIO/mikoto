import emojiData from '@emoji-mart/data/sets/14/twitter.json';
import { init } from 'emoji-mart';
import { use } from 'react';
import { proxyMap } from 'valtio/utils';
import { useSnapshot } from 'valtio/react';

import { normalizeMediaUrl } from '@/components/atoms/Avatar';
import { CurrentSpaceContext } from '@/store';
import { FloatingTooltip } from '@/ui';

init({ data: emojiData });

const EMPTY_EMOJI_CACHE = proxyMap<string, never>();

function CustomEmojiImg({ url, name }: { url: string; name: string }) {
  return (
    <FloatingTooltip
      tooltip={`:${name}:`}
      placement="top"
      offsetOptions={[0, 32]}
    >
      <img
        src={normalizeMediaUrl(url)}
        alt={`:${name}:`}
        className="emoji"
        style={{
          display: 'inline-block',
          verticalAlign: 'middle',
          height: '1.4em',
          maxHeight: '1.4em',
          maxWidth: 'unset',
        }}
      />
    </FloatingTooltip>
  );
}

export default function Emoji({ emoji }: { emoji: string }) {
  const space = use(CurrentSpaceContext);
  // Subscribe to emoji cache to react to live updates.
  useSnapshot(space?.emojis.cache ?? EMPTY_EMOJI_CACHE);
  const custom = space?.emojis.getByName(emoji);

  if (custom) {
    return <CustomEmojiImg url={custom.url} name={custom.name} />;
  }

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
