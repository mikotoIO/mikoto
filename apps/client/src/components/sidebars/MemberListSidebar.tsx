import { Box, Tag } from '@chakra-ui/react';
import styled from '@emotion/styled';
import { faCrown } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ClientMember, ClientSpace } from 'mikotojs';
import { observer } from 'mobx-react-lite';
import { useRef } from 'react';
import { Virtuoso } from 'react-virtuoso';
import { useSetRecoilState } from 'recoil';

import { contextMenuState, useContextMenu } from '@/components/ContextMenu';
import { Avatar } from '@/components/atoms/Avatar';
import { MemberContextMenu } from '@/components/atoms/MessageAvatar';
import { hoverableButtonLike } from '@/components/design';
import { UserContextMenu } from '@/components/modals/ContextMenus';
import { useFetchMember } from '@/hooks';

const StyledMember = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 8px;
  padding: 4px 8px;
  ${hoverableButtonLike}
`;

const MemberElement = observer(({ member }: { member: ClientMember }) => {
  const setContextMenu = useSetRecoilState(contextMenuState);
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

        const { top, left } = elemRef.current.getBoundingClientRect();

        setContextMenu({
          position: { top, right: window.innerWidth - left + 16 },
          elem: <MemberContextMenu member={member} user={member.user} />,
        });
      }}
      onContextMenu={userContextMenu}
    >
      <Avatar size={32} src={member.user.avatar ?? undefined} />
      <Box className="name" color={member.roleColor}>
        {member.user.name}
      </Box>
      {member.isSpaceOwner && (
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
          bg="primary"
          color="white"
        >
          BOT
        </Tag>
      )}
    </StyledMember>
  );
});

const StyledMemberListSidebar = styled.div`
  height: 100%;
  overflow-y: auto;
  box-sizing: border-box;
`;

export const MemberListSidebar = observer(
  ({ space }: { space: ClientSpace }) => {
    useFetchMember(space);

    const spaceMembers = Array.from(space.members?.values() ?? []).toSorted(
      (a, b) => a.user.name.localeCompare(b.user.name),
    );

    return (
      <StyledMemberListSidebar>
        {spaceMembers && (
          <Virtuoso
            components={{
              Header() {
                return (
                  <Box color="gray.200" p={4} fontWeight="bold">
                    Members
                  </Box>
                );
              },
            }}
            style={{ height: '100%', overflowX: 'hidden' }}
            data={spaceMembers}
            itemContent={(idx, member) => <MemberElement member={member} />}
          />
        )}
      </StyledMemberListSidebar>
    );
  },
);
