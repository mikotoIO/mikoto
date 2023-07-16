import styled from 'styled-components';

import { Avatar } from '../atoms/Avatar';

const StyledMember = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 8px;
  padding: 4px 8px;
  border-radius: 4px;
  &:hover {
    background-color: var(--N700);
  }
`;

const Divider = styled.div`
  font-weight: bold;
  margin: 16px;
  color: var(--N300);
`;

function Member() {
  return (
    <StyledMember>
      <Avatar size={32} />
      <div className="name">Cactus</div>
    </StyledMember>
  );
}

export function MemberListSidebar() {
  return (
    <div>
      <Divider>Members</Divider>
      <Member />
      <Member />
      <Member />
    </div>
  );
}
