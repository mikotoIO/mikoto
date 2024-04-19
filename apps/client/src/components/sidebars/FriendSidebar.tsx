import { Box, Heading } from '@chakra-ui/react';
import styled from '@emotion/styled';
import {
  faEarthAmericas,
  faUserGroup,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';
import { useRecoilState } from 'recoil';

import { useMikoto } from '@/hooks';
import { treebarSpaceState } from '@/store';
import { useTabkit } from '@/store/surface';

import { Avatar } from '../atoms/Avatar';
import { hoverableButtonLike } from '../design';

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

export const FriendSidebar = observer(() => {
  const tabkit = useTabkit();
  const mikoto = useMikoto();
  const [, setLeftSidebar] = useRecoilState(treebarSpaceState);

  useEffect(() => {
    mikoto.relations.list(true);
  }, []);

  const friends = Array.from(mikoto.relations.values());

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
      {friends.length === 0 && (
        <Box px={4} color="gray.500">
          <Box>No DMs yet. Maybe add some friends?</Box>
        </Box>
      )}
      {friends.map((friend) => (
        <StyledButtonBase
          key={friend.id}
          onClick={() => {
            const friendSpaceId = friend?.space?.id;
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
            src={friend?.relation?.avatar ?? undefined}
          />
          <div>{friend?.relation?.name ?? 'Deleted User'}</div>
        </StyledButtonBase>
      ))}
    </Box>
  );
});
