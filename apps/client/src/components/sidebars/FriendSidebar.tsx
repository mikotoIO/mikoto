import { Compass, Image, Plus, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSnapshot } from 'valtio/react';

import { Avatar } from '@/components/atoms/Avatar';
import { Dot, IconButton, Skeleton, cx, describeError, toast } from '@/design';
import { useMikoto } from '@/hooks';
import {
  type DmPreview,
  dmPreviewStore,
  loadDmPreviews,
} from '@/store/dmPreviews';
import { useActiveTabId, useTabkit } from '@/store/surface';
import { ackChannel, ackStore, isChannelUnread } from '@/store/unreads';

import {
  SidebarHead,
  SidebarHeadActions,
  SidebarLabel,
  SidebarRow,
  sidebarStyles,
} from './Base';
import styles from './FriendSidebar.module.css';

function formatRelativeTime(iso: string | null | undefined): string {
  if (!iso) return '';
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return '';
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - then.getTime()) / 1000);
  if (diffSec < 60) return 'now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d`;
  if (then.getFullYear() === now.getFullYear()) {
    return then.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  }
  return then.toLocaleDateString(undefined, {
    year: '2-digit',
    month: 'short',
  });
}

function previewText(
  preview: DmPreview | undefined,
  selfId: string | undefined,
): string {
  if (!preview) return 'No messages yet. Say hi.';
  const prefix = selfId && preview.authorId === selfId ? 'You: ' : '';
  if (!preview.content) {
    if (preview.hasAttachments) return `${prefix}Sent an attachment`;
    return `${prefix}…`;
  }
  return `${prefix}${preview.content}`;
}

/** The Home sidebar: Friends, Discover, then direct messages. */
export function FriendSidebar() {
  const tabkit = useTabkit();
  const mikoto = useMikoto();
  const activeTabId = useActiveTabId();
  const [opening, setOpening] = useState<string | null>(null);
  const [loadedPreviewsKey, setLoadedPreviewsKey] = useState<string | null>(
    null,
  );

  useSnapshot(mikoto.relationships.cache);
  useSnapshot(mikoto.channels.cache);
  useSnapshot(ackStore);
  const previewsSnap = useSnapshot(dmPreviewStore);

  const friends = mikoto.relationships.friends;
  const dmFriends = friends.filter((f) => f.channelId);
  const channelIdsKey = dmFriends
    .map((f) => f.channelId)
    .filter((id): id is string => Boolean(id))
    .join(',');

  const lastActivityIso = (channelId: string) => {
    const channel = mikoto.channels._get(channelId);
    return (
      previewsSnap.previews[channelId]?.timestamp ??
      channel?.lastUpdated ??
      null
    );
  };

  const sortedDmFriends = [...dmFriends].sort((a, b) => {
    const aIso = a.channelId ? lastActivityIso(a.channelId) : null;
    const bIso = b.channelId ? lastActivityIso(b.channelId) : null;
    const aTime = aIso ? new Date(aIso).getTime() : 0;
    const bTime = bIso ? new Date(bIso).getTime() : 0;
    return bTime - aTime;
  });

  useEffect(() => {
    const channelIds = channelIdsKey ? channelIdsKey.split(',') : [];
    if (channelIds.length === 0) return;
    let cancelled = false;
    loadDmPreviews(mikoto, channelIds).finally(() => {
      if (!cancelled) setLoadedPreviewsKey(channelIdsKey);
    });
    return () => {
      cancelled = true;
    };
  }, [mikoto, channelIdsKey]);

  const previewsLoading =
    channelIdsKey !== '' && loadedPreviewsKey !== channelIdsKey;
  const selfId = mikoto.user.me?.id;
  const openFriends = () =>
    tabkit.openTab({ kind: 'friends', key: 'friends' }, false);

  return (
    <>
      <SidebarHead title="Home" actions={<SidebarHeadActions />} />
      <nav className={sidebarStyles.scroll} aria-label="Home">
        <SidebarRow
          icon={<Users size={16} aria-hidden />}
          label="Friends"
          active={activeTabId === 'friends/friends'}
          onClick={openFriends}
        />
        <SidebarRow
          icon={<Compass size={16} aria-hidden />}
          label="Discover spaces"
          active={activeTabId === 'discovery/discovery'}
          onClick={() =>
            tabkit.openTab({ kind: 'discovery', key: 'discovery' }, false)
          }
        />

        <SidebarLabel
          action={
            <IconButton aria-label="Message a friend" onClick={openFriends}>
              <Plus size={14} aria-hidden />
            </IconButton>
          }
        >
          Direct messages
        </SidebarLabel>

        {sortedDmFriends.length === 0 && (
          <p className={sidebarStyles.empty}>
            No conversations yet.{' '}
            <button type="button" onClick={openFriends}>
              Add a friend
            </button>{' '}
            to start one.
          </p>
        )}

        {sortedDmFriends.map((friend) => {
          const channelId = friend.channelId;
          if (!channelId) return null;
          const preview = previewsSnap.previews[channelId];
          const timestampIso = lastActivityIso(channelId);
          const active = activeTabId === `textChannel/${channelId}`;
          const unread = !active && isChannelUnread(timestampIso, channelId);
          const showPreviewSkeleton = !preview && previewsLoading;
          return (
            <button
              type="button"
              key={friend.id}
              className={cx(
                styles.dm,
                active && styles.active,
                unread && styles.unread,
              )}
              aria-current={active ? 'page' : undefined}
              disabled={opening === friend.id}
              onClick={async () => {
                setOpening(friend.id);
                try {
                  const openedChannel = await friend.openDm();
                  tabkit.openTab(
                    {
                      kind: 'textChannel',
                      key: openedChannel.id,
                      channelId: openedChannel.id,
                    },
                    false,
                  );
                  openedChannel.ack().catch(() => {});
                  ackChannel(openedChannel.id, new Date().toISOString());
                } catch (err) {
                  toast({
                    type: 'error',
                    title: `Couldn't open your conversation with ${friend.user.name}`,
                    description: describeError(err, { context: 'action' })
                      .message,
                  });
                } finally {
                  setOpening(null);
                }
              }}
            >
              <span className={styles.avatar}>
                <Avatar
                  size={30}
                  src={friend.user.avatar ?? undefined}
                  userId={friend.user.id}
                />
              </span>
              <span className={styles.text}>
                <span className={styles.name}>{friend.user.name}</span>
                <span className={styles.preview}>
                  {showPreviewSkeleton ? (
                    <Skeleton width="70%" height={10} />
                  ) : (
                    <>
                      {preview?.content === '' && preview.hasAttachments && (
                        <Image size={12} aria-hidden />
                      )}
                      <span className={styles.previewText}>
                        {previewText(preview, selfId)}
                      </span>
                    </>
                  )}
                </span>
              </span>
              <span className={styles.right}>
                {timestampIso && (
                  <time dateTime={timestampIso}>
                    {formatRelativeTime(timestampIso)}
                  </time>
                )}
                {unread && <Dot />}
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
