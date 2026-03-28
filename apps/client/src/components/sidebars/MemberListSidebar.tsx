import { Box } from '@chakra-ui/react';
import styled from '@emotion/styled';
import { faCrown, faGlasses } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { MikotoMember, MikotoSpace } from '@mikoto-io/mikoto.js';
import { useSetAtom } from 'jotai';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Virtuoso } from 'react-virtuoso';
import { useSnapshot } from 'valtio';

import { contextMenuState, useContextMenu } from '@/components/ContextMenu';
import { Avatar } from '@/components/atoms/Avatar';
import { MemberContextMenu } from '@/components/atoms/MessageAvatar';
import { hoverableButtonLike } from '@/components/design';
import { UserContextMenu } from '@/components/modals/ContextMenus';
import { Tag } from '@/components/ui';
import { useFetchMember, useInterval, useMikoto } from '@/hooks';

interface ActiveTyper {
  userId: string;
  timestamp: number;
}

function useActiveTypers(spaceId: string): Set<string> {
  const mikoto = useMikoto();
  const [typers, setTypers] = useState<ActiveTyper[]>([]);

  useEffect(() => {
    const handler = (ev: { channelId: string; userId: string }) => {
      // Only track typing for channels in this space
      const channel = mikoto.channels._get(ev.channelId);
      if (!channel || channel.spaceId !== spaceId) return;

      setTypers((prev) => {
        const next = [...prev];
        const existing = next.find((t) => t.userId === ev.userId);
        if (existing) {
          existing.timestamp = Date.now() + 5000;
        } else {
          next.push({ userId: ev.userId, timestamp: Date.now() + 5000 });
        }
        return next;
      });
    };
    mikoto.ws.on('typing.onUpdate', handler);
    return () => {
      mikoto.ws.off('typing.onUpdate', handler);
    };
  }, [spaceId]);

  useInterval(() => {
    if (typers.length === 0) return;
    setTypers((prev) => prev.filter((t) => t.timestamp > Date.now()));
  }, 500);

  return new Set(typers.map((t) => t.userId));
}

const StyledMember = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 8px;
  padding: 4px 8px;
  ${hoverableButtonLike}
`;

const PulsingDot = styled.span`
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--chakra-colors-green-400);
  margin-left: 4px;
  animation: pulse 1.2s ease-in-out infinite;
  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.3;
    }
  }
`;

function MemberElement({
  member,
  isTyping,
}: {
  member: MikotoMember;
  isTyping?: boolean;
}) {
  const setContextMenu = useSetAtom(contextMenuState);
  const elemRef = useRef<HTMLDivElement>(null);

  const userContextMenu = useContextMenu(() => (
    <UserContextMenu user={member.user} member={member} />
  ));

  return (
    <StyledMember
      ref={elemRef}
      onClick={(ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        if (elemRef.current === null) return;

        const { top, left, width } = elemRef.current.getBoundingClientRect();

        setContextMenu({
          position: { top, left: left + width + 8 },
          elem: <MemberContextMenu member={member} user={member.user} />,
        });
      }}
      onContextMenu={userContextMenu}
    >
      <Avatar
        size={32}
        src={member.user.avatar ?? undefined}
        userId={member.user.id}
      />
      <Box className="name" color={member.roleColor}>
        {member.user.name}
      </Box>
      {member.isOwner && (
        <Box display="inline-block" color="yellow.500">
          <FontAwesomeIcon className="crown" icon={faCrown} />
        </Box>
      )}

      {member.user.category === 'BOT' && (
        <Tag
          size="sm"
          fontSize="2xs"
          px={1}
          minH="18px"
          variant="solid"
          bg="blue.500"
          color="white"
        >
          <FontAwesomeIcon icon={faGlasses} />
        </Tag>
      )}
      {isTyping && member.user.category === 'BOT' && <PulsingDot />}
    </StyledMember>
  );
}

const StyledMemberListSidebar = styled.div`
  height: 100%;
  overflow-y: auto;
  box-sizing: border-box;
`;

export function MemberListSidebar({ space }: { space: MikotoSpace }) {
  useFetchMember(space);
  const activeTypers = useActiveTypers(space.id);

  // Use a snapshot of the members cache to ensure reactivity
  const members = useSnapshot(space.members.cache);
  const spaceMembers = Array.from(members.values() ?? []).toSorted((a, b) =>
    a.user.name.localeCompare(b.user.name),
  );

  return (
    <StyledMemberListSidebar>
      <Virtuoso
        style={{ height: '100%', overflowX: 'hidden' }}
        data={spaceMembers}
        itemContent={(_idx, member) => (
          <MemberElement
            member={member}
            isTyping={activeTypers.has(member.user.id)}
          />
        )}
      />
    </StyledMemberListSidebar>
  );
}
