import type { MikotoMessage } from '@mikoto-io/mikoto.js';
import { SmilePlus } from 'lucide-react';
import { useState } from 'react';
import { useSnapshot } from 'valtio/react';

import { useCustomEmojis } from '@/components/molecules/markdown';
import {
  IconButton,
  Popover,
  PopoverTrigger,
  Tooltip,
  cx,
  describeError,
  toast,
} from '@/design';
import { useMikoto } from '@/hooks';

import { EmojiPickerPopover } from '../EmojiPicker';
import { type EmojiEntry, emojiImageUrl, useEmojiSet } from '../emojiData';
import styles from './Message.module.css';

/** A reaction as a valtio snapshot hands it out. */
interface ReactionView {
  emoji: string;
  emojiId?: string | null;
  count: number;
  userIds: readonly string[];
}

/** At most this many names in a reaction's tooltip; the rest are counted. */
const MAX_NAMES = 6;

async function attempt(action: Promise<void>, failure: string) {
  try {
    await action;
  } catch (err) {
    toast({
      type: 'error',
      title: failure,
      description: describeError(err, { context: 'action' }).message,
    });
  }
}

/** React to `message` with a picked emoji. */
export function reactWith(message: MikotoMessage, emoji: EmojiEntry) {
  const key = emoji.key;
  if (message.hasReacted(key)) return;
  void attempt(
    message.react(key, emoji.custom?.id ?? null),
    "Couldn't add your reaction",
  );
}

/** Picker for adding a reaction. Render inside a `<Popover>`. */
export function ReactionPickerPopover({
  message,
  onClose,
}: {
  message: MikotoMessage;
  onClose: () => void;
}) {
  return (
    <EmojiPickerPopover
      onPick={(emoji, keepOpen) => {
        reactWith(message, emoji);
        if (!keepOpen) onClose();
      }}
    />
  );
}

function useReactionEmoji(reaction: ReactionView) {
  const custom = useCustomEmojis();
  const standard = useEmojiSet();
  if (reaction.emojiId) {
    const emoji = custom.byId.get(reaction.emojiId);
    return {
      label: emoji ? `:${emoji.name}:` : 'a custom emoji',
      url: emoji?.url,
    };
  }
  const emoji = standard?.byId.get(reaction.emoji);
  return {
    label: `:${reaction.emoji}:`,
    url: emoji ? emojiImageUrl(emoji) : undefined,
  };
}

function ReactionChip({
  message,
  reaction,
  inSpace,
}: {
  message: MikotoMessage;
  reaction: ReactionView;
  inSpace?: boolean;
}) {
  const mikoto = useMikoto();
  const { label, url } = useReactionEmoji(reaction);
  const [failedUrl, setFailedUrl] = useState<string>();
  const me = mikoto.user.me?.id;
  const mine = !!me && reaction.userIds.includes(me);

  const nameOf = (id: string) => {
    if (id === me) return 'You';
    if (inSpace) {
      const member = mikoto.channels
        ._get(message.channelId)
        ?.space?.members._get(id);
      return member?.name ?? member?.user.name;
    }
    return message.author?.id === id ? message.author.name : undefined;
  };
  const names = reaction.userIds.slice(0, MAX_NAMES).flatMap((id) => {
    const name = nameOf(id);
    return name ? [name] : [];
  });
  const others = reaction.count - names.length;
  const who =
    names.length === 0
      ? `${reaction.count} ${reaction.count === 1 ? 'person' : 'people'}`
      : others > 0
        ? `${names.join(', ')} and ${others} ${others === 1 ? 'other' : 'others'}`
        : names.length > 1
          ? `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`
          : names[0];

  return (
    <Tooltip content={`${who} reacted with ${label}`}>
      <button
        type="button"
        className={cx(styles.reaction, mine && styles.reactionMine)}
        aria-pressed={mine}
        aria-label={`${label}, ${reaction.count} ${
          reaction.count === 1 ? 'reaction' : 'reactions'
        }`}
        onClick={() =>
          void attempt(
            message.toggleReaction(reaction.emoji, reaction.emojiId ?? null),
            mine
              ? "Couldn't remove your reaction"
              : "Couldn't add your reaction",
          )
        }
      >
        {url && failedUrl !== url ? (
          <img
            className={styles.reactionEmoji}
            src={url}
            alt=""
            draggable={false}
            onError={() => setFailedUrl(url)}
          />
        ) : (
          <span className={styles.reactionText}>{label}</span>
        )}
        <span className={styles.reactionCount}>{reaction.count}</span>
      </button>
    </Tooltip>
  );
}

/** The reactions under a message, plus a button to add one. */
export function Reactions({
  message,
  inSpace,
}: {
  message: MikotoMessage;
  inSpace?: boolean;
}) {
  const { reactions } = useSnapshot(message);
  const [open, setOpen] = useState(false);
  if (reactions.length === 0) return null;

  return (
    <div className={styles.reactions}>
      {reactions.map((r) => (
        <ReactionChip
          key={r.emoji}
          message={message}
          reaction={r}
          inSpace={inSpace}
        />
      ))}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <IconButton
              aria-label="Add reaction"
              className={styles.addReaction}
            >
              <SmilePlus size={14} />
            </IconButton>
          }
        />
        <ReactionPickerPopover
          message={message}
          onClose={() => setOpen(false)}
        />
      </Popover>
    </div>
  );
}
