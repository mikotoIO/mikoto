import {
  faEarthAmericas,
  faUserGroup,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Box, Heading } from '@mikoto-io/lucid';
import { Relation } from 'mikotojs';
import { useEffect, useState } from 'react';
import { useRecoilState } from 'recoil';
import styled from 'styled-components';

import { useMikoto } from '../../hooks';
import { treebarSpaceState } from '../../store';
import { useTabkit } from '../../store/surface';
import { Avatar } from '../atoms/Avatar';

const StyledButtonBase = styled.div`
  display: flex;
  height: 40px;
  width: 100%;
  color: var(--N300);
  cursor: pointer;
  &:hover {
    background-color: var(--N700);
  }
  align-items: center;
  border-radius: 4px;
  ${Avatar}, svg {
    margin-left: 8px;
    margin-right: 8px;
  }
`;

export function FriendSidebar() {
  const tabkit = useTabkit();
  const mikoto = useMikoto();
  const [friends, setFriends] = useState<Relation[]>([]);
  const [, setLeftSidebar] = useRecoilState(treebarSpaceState);

  useEffect(() => {
    mikoto.relations.list(true).then(setFriends);
  }, []);

  return (
    <Box p={8}>
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
      <Heading fs={14} p={{ left: 8 }} txt="N300">
        Direct Messages
      </Heading>
      {Array.from(mikoto.relations.values()).map((friend) => (
        <StyledButtonBase
          key={friend.id}
          onClick={() => {
            const friendSpaceId = friend?.space?.id;
            setLeftSidebar(
              friendSpaceId
                ? {
                    kind: 'dmExplorer',
                    key: `dmExplorer/${friendSpaceId}`,
                    spaceId: friendSpaceId,
                    relationId: friend.id,
                  }
                : null,
            );
          }}
        >
          <Avatar size={32} src={friend?.relation?.avatar ?? undefined} />
          <div>{friend?.relation?.name ?? 'Deleted User'}</div>
        </StyledButtonBase>
      ))}
    </Box>
  );
}
