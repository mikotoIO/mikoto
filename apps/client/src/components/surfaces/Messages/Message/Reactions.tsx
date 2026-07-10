import styled from '@emotion/styled';
import type { MikotoEmoji, MikotoMessage } from '@mikoto-io/mikoto.js';
import { useSetAtom } from 'jotai';
import { Suspense, lazy } from 'react';
import { proxyMap } from 'valtio/utils';
import { useSnapshot } from 'valtio/react';

import { contextMenuState } from '@/components/ContextMenu';
import { normalizeMediaUrl } from '@/components/atoms/Avatar';
import { useMikoto } from '@/hooks';

const EmojiPicker = lazy(() => import('../EmojiPicker'));

const EMPTY_EMOJI_CACHE = proxyMap<string, never>();

const ReactionsRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 6px;
`;

const ReactionPill = styled.button<{ active?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 8px;
  border: 1px solid
    ${(p) =>
      p.active
        ? 'var(--chakra-colors-blue-500)'
        : 'var(--chakra-colors-gray-650)'};
  background-color: ${(p) =>
    p.active
      ? 'color-mix(in srgb, var(--chakra-colors-blue-500) 25%, transparent)'
      : 'var(--chakra-colors-gray-750)'};
  color: var(--chakra-colors-text);
  cursor: pointer;
  line-height: 1;

  &:hover {
    background-color: var(--chakra-colors-gray-700);
  }

  img {
    display: block;
    width: 18px;
    height: 18px;
  }

  span.count {
    min-width: 8px;
    text-align: center;
  }
`;

const AddReactionButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  width: 28px;
  height: 22px;
  border-radius: 8px;
  border: 1px solid var(--chakra-colors-gray-650);
  background: var(--chakra-colors-gray-750);
  color: var(--chakra-colors-gray-300);
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 0.1s ease-in-out;

  &:hover {
    opacity: 1;
    background: var(--chakra-colors-gray-700);
  }
`;

function CustomEmojiImg({ emoji }: { emoji: MikotoEmoji }) {
  return (
    <img
      src={normalizeMediaUrl(emoji.url)}
      alt={`:${emoji.name}:`}
      title={`:${emoji.name}:`}
    />
  );
}

interface ReactionsProps {
  message: MikotoMessage;
}

/**
 * Parse the wire format for a reaction emoji. Returns whether it is a custom
 * emoji ID, or a raw display string (unicode emoji or `:shortcode:`).
 */
function parseEmoji(emoji: string): { kind: 'custom'; id: string } | { kind: 'raw'; value: string } {
  if (emoji.startsWith('custom:')) {
    return { kind: 'custom', id: emoji.slice('custom:'.length) };
  }
  return { kind: 'raw', value: emoji };
}

export function Reactions({ message }: ReactionsProps) {
  const messageSnap = useSnapshot(message);
  const mikoto = useMikoto();
  const setContextMenu = useSetAtom(contextMenuState);
  const me = mikoto.user.me?.id;
  const spaceId = message.channel?.spaceId;
  const space = spaceId ? mikoto.spaces.cache.get(spaceId) : undefined;
  // Always subscribe to emoji changes so we re-render when emojis update.
  // Falls back to an empty proxy when not in a space.
  useSnapshot(space?.emojis.cache ?? EMPTY_EMOJI_CACHE);

  if (messageSnap.reactions.length === 0) return null;

  const openPicker = (ev: React.MouseEvent) => {
    ev.preventDefault();
    ev.stopPropagation();
    setContextMenu({
      position: { top: ev.clientY, left: ev.clientX },
      elem: (
        <Suspense fallback={null}>
          <EmojiPicker
            onEmojiSelect={async (shortcode) => {
              setContextMenu(null);
              const name = shortcode.replace(/:/g, '');
              const custom = space?.emojis.getByName(name);
              const emoji = custom ? `custom:${custom.id}` : `:${name}:`;
              try {
                await message.toggleReaction(emoji);
              } catch {
                /* ignore */
              }
            }}
          />
        </Suspense>
      ),
    });
  };

  return (
    <ReactionsRow>
      {messageSnap.reactions.map((r) => {
        const parsed = parseEmoji(r.emoji);
        const custom =
          parsed.kind === 'custom' ? space?.emojis._get(parsed.id) : undefined;
        const active = !!me && r.userIds.includes(me);
        return (
          <ReactionPill
            key={r.emoji}
            active={active}
            onClick={async () => {
              try {
                await message.toggleReaction(r.emoji);
              } catch {
                /* ignore */
              }
            }}
          >
            {custom ? (
              <CustomEmojiImg emoji={custom} />
            ) : (
              <span style={{ fontSize: '14px' }}>
                {parsed.kind === 'raw' ? parsed.value : ':?:'}
              </span>
            )}
            <span className="count">{r.count}</span>
          </ReactionPill>
        );
      })}
      {spaceId && (
        <AddReactionButton onClick={openPicker} title="Add reaction">
          +
        </AddReactionButton>
      )}
    </ReactionsRow>
  );
}

/** Standalone "Add Reaction" button shown when there are no reactions yet. */
export function AddReaction({ message }: ReactionsProps) {
  const mikoto = useMikoto();
  const setContextMenu = useSetAtom(contextMenuState);
  const spaceId = message.channel?.spaceId;
  const space = spaceId ? mikoto.spaces.cache.get(spaceId) : undefined;

  if (!spaceId) return null;

  return (
    <AddReactionButton
      title="Add reaction"
      onClick={(ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        setContextMenu({
          position: { top: ev.clientY, left: ev.clientX },
          elem: (
            <Suspense fallback={null}>
              <EmojiPicker
                onEmojiSelect={async (shortcode) => {
                  setContextMenu(null);
                  const name = shortcode.replace(/:/g, '');
                  const custom = space?.emojis.getByName(name);
                  const emoji = custom ? `custom:${custom.id}` : `:${name}:`;
                  try {
                    await message.toggleReaction(emoji);
                  } catch {
                    /* ignore */
                  }
                }}
              />
            </Suspense>
          ),
        });
      }}
    >
      +
    </AddReactionButton>
  );
}
