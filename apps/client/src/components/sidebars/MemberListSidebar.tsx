import { Box } from '@chakra-ui/react';
import styled from '@emotion/styled';
import { faBarsStaggered, faCrown } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { MikotoMember, MikotoSpace } from '@mikoto-io/mikoto.js';
import { observer } from 'mobx-react-lite';
import { useEffect, useRef } from 'react';
import { Virtuoso } from 'react-virtuoso';
import { useRecoilState, useSetRecoilState } from 'recoil';
import { useSnapshot } from 'valtio';

import { contextMenuState, useContextMenu } from '@/components/ContextMenu';
import { Avatar } from '@/components/atoms/Avatar';
import { MemberContextMenu } from '@/components/atoms/MessageAvatar';
import { hoverableButtonLike } from '@/components/design';
import { UserContextMenu } from '@/components/modals/ContextMenus';
import { TabBarButton } from '@/components/tabs';
import { Tag } from '@/components/ui';
import { useFetchMember } from '@/hooks';
import { workspaceState } from '@/store';

const StyledMember = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 8px;
  padding: 4px 8px;
  ${hoverableButtonLike}
`;

const MemberElement = observer(({ member }: { member: MikotoMember }) => {
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

const HeaderContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 8px;
  color: var(--chakra-colors-gray-200);
  font-weight: bold;
`;

export const MemberListSidebar = observer(
  ({ space }: { space: MikotoSpace }) => {
    const { isLoading } = useFetchMember(space);
    const [, setWorkspace] = useRecoilState(workspaceState);

    const fetchMembersManually = async () => {
      console.log('Manually fetching members');
      try {
        const members = await space.members.list();
        console.log(`Manually fetched ${members.length} members`);
      } catch (err) {
        console.error('Error manually fetching members:', err);
      }
    };

    // Force fetch on first render
    useEffect(() => {
      fetchMembersManually();
    }, []);

    // Use a snapshot of the members cache to ensure reactivity
    const members = useSnapshot(space.members.cache);
    const spaceMembers = Array.from(members.values() ?? []).toSorted((a, b) =>
      a.user.name.localeCompare(b.user.name),
    );

    return (
      <StyledMemberListSidebar>
        <Virtuoso
          components={{
            Header() {
              return (
                <HeaderContainer>
                  <div
                    onClick={fetchMembersManually}
                    style={{ cursor: 'pointer' }}
                  >
                    Members ({isLoading ? 'Loading' : spaceMembers.length})
                  </div>
                  <TabBarButton
                    onClick={() => {
                      setWorkspace((ws) => ({
                        ...ws,
                        rightOpen: !ws.rightOpen,
                      }));
                    }}
                  >
                    <FontAwesomeIcon icon={faBarsStaggered} />
                  </TabBarButton>
                </HeaderContainer>
              );
            },
          }}
          style={{ height: '100%', overflowX: 'hidden' }}
          data={spaceMembers}
          itemContent={(_idx, member) => <MemberElement member={member} />}
        />
      </StyledMemberListSidebar>
    );
  },
);
