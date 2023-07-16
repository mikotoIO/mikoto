import { Member } from 'mikotojs';
import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { useMikoto } from '../../hooks';
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

function MemberElement({ member }: { member: Member }) {
  return (
    <StyledMember>
      <Avatar size={32} src={member.user.avatar ?? undefined} />
      <div className="name">{member.user.name}</div>
    </StyledMember>
  );
}

export function MemberListSidebar({ spaceId }: { spaceId: string }) {
  const [members, setMembers] = useState<Member[]>([]);
  const mikoto = useMikoto();

  useEffect(() => {
    mikoto.client.members.list(spaceId).then((x) => setMembers(x));
  }, [spaceId]);

  return (
    <div>
      <Divider>Members</Divider>
      {members.map((x) => (
        <MemberElement key={x.id} member={x} />
      ))}
    </div>
  );
}
