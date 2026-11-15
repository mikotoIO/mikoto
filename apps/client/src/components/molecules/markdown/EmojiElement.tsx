import emojiData from '@emoji-mart/data/sets/14/twitter.json';
import { init } from 'emoji-mart';

import { Tooltip } from '@/design';

import styles from './Markdown.module.css';

init({ data: emojiData });

export default function Emoji({ emoji }: { emoji: string }) {
  return (
    <Tooltip content={`:${emoji}:`}>
      <span className={styles.emoji} aria-label={`:${emoji}:`} role="img">
        {/* @ts-expect-error 2339 */}
        <em-emoji
          id={emoji}
          className="emoji"
          set="twitter"
          size="1.2em"
          fallback={`:${emoji}:`}
        />
      </span>
    </Tooltip>
  );
}
