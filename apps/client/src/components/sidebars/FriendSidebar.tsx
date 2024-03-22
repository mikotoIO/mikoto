import { Box, Heading } from '@chakra-ui/react';
import {
  faEarthAmericas,
  faUserGroup,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';
import { useRecoilState } from 'recoil';
import styled from '@emotion/styled';

import { useMikoto } from '../../hooks';
import { treebarSpaceState } from '../../store';
import { useTabkit } from '../../store/surface';
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
      <Heading fontSize="14px" pl="8px" color="gray.200">
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
