import {
  faEarthAmericas,
  faUserGroup,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Box, Heading } from '@mikoto-io/lucid';
import styled from 'styled-components';

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
  return (
    <Box p={8}>
      <StyledButtonBase>
        <FontAwesomeIcon icon={faUserGroup} fixedWidth />
        <span>Friends</span>
      </StyledButtonBase>
      <StyledButtonBase>
        <FontAwesomeIcon icon={faEarthAmericas} fixedWidth />
        <span>Discover</span>
      </StyledButtonBase>
      <Heading fs={14} p={{ left: 8 }} txt="N300">
        Direct Messaging
      </Heading>
      <StyledButtonBase>
        <Avatar size={32} />
        <div>FriendName</div>
      </StyledButtonBase>
    </Box>
  );
}
