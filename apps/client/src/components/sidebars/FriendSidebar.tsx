import { Box, Heading } from '@chakra-ui/react';
import styled from '@emotion/styled';
import {
  faEarthAmericas,
  faUserGroup,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { MikotoRelationship } from '@mikoto-io/mikoto.js';
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

const RequestBadge = styled.span`
  margin-left: auto;
  margin-right: 8px;
  background: var(--chakra-colors-red-500);
  color: white;
  border-radius: 9999px;
  font-size: 11px;
  font-weight: 700;
  padding: 1px 6px;
  min-width: 18px;
  text-align: center;
`;

export function FriendSidebar() {
  const mikoto = useMikoto();
  const tabkit = useTabkit();
  const [, setLeftSidebar] = useAtom(treebarSpaceState);

  useEffect(() => {
    mikoto.relationships.list();
  }, []);

  useSnapshot(mikoto.relationships.cache);

  const allRelations = mikoto.relationships.values();
  const friends = allRelations.filter(
    (r: MikotoRelationship) => r.state === 'FRIEND',
  );
  const incomingRequests = allRelations.filter(
    (r: MikotoRelationship) => r.state === 'INCOMING_REQUEST',
  );

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
        {incomingRequests.length > 0 && (
          <RequestBadge>{incomingRequests.length}</RequestBadge>
        )}
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
      {friends.filter((f: MikotoRelationship) => f.spaceId).length === 0 && (
        <Box px={4} color="gray.500">
          <Box>No DMs yet. Maybe add some friends?</Box>
        </Box>
      )}
      {friends
        .filter((f: MikotoRelationship) => f.spaceId)
        .map((friend: MikotoRelationship) => (
          <StyledButtonBase
            key={friend.id}
            onClick={() => {
              if (friend.spaceId) {
                setLeftSidebar({
                  kind: 'dmExplorer',
                  key: `dmExplorer/${friend.spaceId}`,
                  spaceId: friend.spaceId,
                  relationId: friend.relationId,
                });
              }
            }}
          >
            <Avatar
              className="avatar"
              size={32}
              userId={friend.relationId}
            />
            <div>{friend.relationId}</div>
          </StyledButtonBase>
        ))}
    </Box>
  );
}
