import { Box, Heading } from '@chakra-ui/react';
import styled from '@emotion/styled';
import {
  faEarthAmericas,
  faUserGroup,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useAtom } from 'jotai';
import { useEffect } from 'react';
import { useSnapshot } from 'valtio/react';

import { Avatar } from '@/components/atoms/Avatar';
import { hoverableButtonLike } from '@/components/design';
import { useMikoto } from '@/hooks';
import { treebarSpaceState } from '@/store';
import { useTabkit } from '@/store/surface';

const StyledButtonBase = styled.div`
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

export function FriendSidebar() {
  const tabkit = useTabkit();
  const mikoto = useMikoto();
  const [, setLeftSidebar] = useAtom(treebarSpaceState);

  useSnapshot(mikoto.relationships.cache);

  useEffect(() => {
    mikoto.relationships.list();
  }, []);

  const friends = mikoto.relationships.friends;
  const dmFriends = friends.filter((f) => f.spaceId);

  return (
    <Box p={2}>
      <StyledButtonBase
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
      </StyledButtonBase>
      <StyledButtonBase
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
      </StyledButtonBase>
      <Heading fontSize="14px" p={2} color="gray.200">
        Direct Messages
      </Heading>
      {dmFriends.length === 0 && (
        <Box px={4} color="gray.500">
          <Box>No DMs yet. Maybe add some friends?</Box>
        </Box>
      )}
      {dmFriends.map((friend) => (
        <StyledButtonBase
          key={friend.id}
          onClick={() => {
            const friendSpaceId = friend.spaceId;
            if (friendSpaceId) {
              setLeftSidebar({
                kind: 'dmExplorer',
                key: `dmExplorer/${friendSpaceId}`,
                spaceId: friendSpaceId,
                relationId: friend.id,
              });
            }
          }}
        >
          <Avatar
            className="avatar"
            size={32}
            src={friend.user.avatar ?? undefined}
            userId={friend.user.id}
          />
          <div>{friend.user.name}</div>
        </StyledButtonBase>
      ))}
    </Box>
  );
}
