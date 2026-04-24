import { Box, Heading } from '@chakra-ui/react';
import styled from '@emotion/styled';
import {
  faEarthAmericas,
  faImage,
  faUserGroup,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useEffect } from 'react';
import { useSnapshot } from 'valtio/react';

import { Avatar } from '@/components/atoms/Avatar';
import { hoverableButtonLike } from '@/components/design';
import { useMikoto } from '@/hooks';
import {
  type DmPreview,
  dmPreviewStore,
  loadDmPreviews,
} from '@/store/dmPreviews';
import { useTabkit } from '@/store/surface';
import { ackChannel, ackStore, isChannelUnread } from '@/store/unreads';

const SimpleButton = styled.div`
  display: flex;
  height: 40px;
  width: 100%;
  color: var(--chakra-colors-gray-300);
  align-items: center;

  ${hoverableButtonLike}
  .avatar,
  svg {
    margin-left: 8px;
    margin-right: 8px;
  }
`;

const DmItem = styled.div<{ unread: boolean }>`
  display: flex;
  height: 52px;
  width: 100%;
  padding: 6px 8px;
  gap: 10px;
  align-items: center;
  color: ${({ unread }) =>
    unread ? 'var(--chakra-colors-text)' : 'var(--chakra-colors-gray-300)'};
  font-weight: ${({ unread }) => (unread ? 600 : 400)};

  ${hoverableButtonLike}
`;

const DmMeta = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
`;

const DmTopRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
`;

const DmName = styled.div`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
`;

const DmTimestamp = styled.span<{ unread: boolean }>`
  font-size: 11px;
  color: ${({ unread }) =>
    unread
      ? 'var(--chakra-colors-primary-400)'
      : 'var(--chakra-colors-gray-400)'};
  flex-shrink: 0;
`;

const DmPreviewRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 400;
  color: var(--chakra-colors-gray-400);
  min-width: 0;
`;

const DmPreviewText = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
  flex: 1;
`;

const UnreadDot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: var(--chakra-colors-primary-400);
  flex-shrink: 0;
`;

function formatRelativeTime(iso: string | null | undefined): string {
  if (!iso) return '';
  const then = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - then.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return 'now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h`;
  const sameYear = then.getFullYear() === now.getFullYear();
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d`;
  if (sameYear) {
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
  if (!preview) return 'No messages yet';
  const isSelf = selfId && preview.authorId === selfId;
  const prefix = isSelf ? 'You: ' : '';
  if (!preview.content) {
    if (preview.hasAttachments) return `${prefix}Sent an attachment`;
    return `${prefix}…`;
  }
  return `${prefix}${preview.content}`;
}

export function FriendSidebar() {
  const tabkit = useTabkit();
  const mikoto = useMikoto();

  useSnapshot(mikoto.relationships.cache);
  useSnapshot(mikoto.channels.cache);
  useSnapshot(ackStore);
  const previewsSnap = useSnapshot(dmPreviewStore);

  const friends = mikoto.relationships.friends;
  const dmFriends = friends.filter((f) => f.channelId);

  const sortedDmFriends = [...dmFriends].sort((a, b) => {
    const aChannel = a.channelId
      ? mikoto.channels._get(a.channelId)
      : undefined;
    const bChannel = b.channelId
      ? mikoto.channels._get(b.channelId)
      : undefined;
    const aTime = aChannel?.lastUpdated
      ? new Date(aChannel.lastUpdated).getTime()
      : 0;
    const bTime = bChannel?.lastUpdated
      ? new Date(bChannel.lastUpdated).getTime()
      : 0;
    return bTime - aTime;
  });

  useEffect(() => {
    const channelIds = dmFriends
      .map((f) => f.channelId)
      .filter((id): id is string => Boolean(id));
    if (channelIds.length > 0) {
      loadDmPreviews(mikoto, channelIds);
    }
  }, [mikoto, dmFriends.map((f) => f.channelId).join(',')]);

  const selfId = mikoto.user.me?.id;

  return (
    <Box p={2}>
      <SimpleButton
        onClick={() => {
          tabkit.openTab(
            {
              kind: 'friends',
              key: 'friends',
            },
            false,
          );
        }}
      >
        <FontAwesomeIcon icon={faUserGroup} fixedWidth />
        <span>Friends</span>
      </SimpleButton>
      <SimpleButton
        onClick={() => {
          tabkit.openTab(
            {
              kind: 'discovery',
              key: 'discovery',
            },
            false,
          );
        }}
      >
        <FontAwesomeIcon icon={faEarthAmericas} fixedWidth />
        <span>Discover</span>
      </SimpleButton>
      <Heading fontSize="14px" p={2} color="gray.200">
        Direct Messages
      </Heading>
      {sortedDmFriends.length === 0 && (
        <Box px={4} color="gray.500">
          <Box>No DMs yet. Maybe add some friends?</Box>
        </Box>
      )}
      {sortedDmFriends.map((friend) => {
        const channelId = friend.channelId!;
        const channel = mikoto.channels._get(channelId);
        const unread = isChannelUnread(channel?.lastUpdated, channelId);
        const preview = previewsSnap.previews[channelId] as
          | DmPreview
          | undefined;
        const timestampIso = preview?.timestamp ?? channel?.lastUpdated ?? null;
        return (
          <DmItem
            key={friend.id}
            unread={unread}
            onClick={async () => {
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
            }}
          >
            <Avatar
              className="avatar"
              size={40}
              src={friend.user.avatar ?? undefined}
              userId={friend.user.id}
            />
            <DmMeta>
              <DmTopRow>
                <DmName>{friend.user.name}</DmName>
                {timestampIso && (
                  <DmTimestamp unread={unread}>
                    {formatRelativeTime(timestampIso)}
                  </DmTimestamp>
                )}
              </DmTopRow>
              <DmPreviewRow>
                <DmPreviewText>
                  {preview?.content === '' && preview.hasAttachments && (
                    <FontAwesomeIcon
                      icon={faImage}
                      style={{ marginRight: 4 }}
                    />
                  )}
                  {previewText(preview, selfId)}
                </DmPreviewText>
                {unread && <UnreadDot />}
              </DmPreviewRow>
            </DmMeta>
          </DmItem>
        );
      })}
    </Box>
  );
}
