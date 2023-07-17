import { faCrown } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Member, Space } from 'mikotojs';
import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { useMikoto } from '../../hooks';
import { useContextMenu } from '../ContextMenu';
import { Avatar } from '../atoms/Avatar';
import { UserContextMenu } from '../modals/ContextMenus';

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

  .crown {
    color: var(--Y700);
  }
`;

const Divider = styled.div`
  font-weight: bold;
  margin: 16px;
  color: var(--N300);
`;

function MemberElement({ member, space }: { space: Space; member: Member }) {
  const userContextMenu = useContextMenu(() => (
    <UserContextMenu user={member.user} />
  ));

  return (
    <StyledMember onContextMenu={userContextMenu}>
      <Avatar size={32} src={member.user.avatar ?? undefined} />
      <div className="name">{member.user.name}</div>
      {member.user.id === space.ownerId && (
        <FontAwesomeIcon className="crown" icon={faCrown} />
      )}
    </StyledMember>
  );
}

export function MemberListSidebar({ space }: { space: Space }) {
  const [members, setMembers] = useState<Member[]>([]);
  const mikoto = useMikoto();

  useEffect(() => {
    mikoto.client.members.list(space.id).then((x) => setMembers(x));
  }, [space.id]);

  return (
    <div>
      <Divider>Members</Divider>
      {members.map((x) => (
        <MemberElement key={x.id} member={x} space={space} />
      ))}
    </div>
  );
}
