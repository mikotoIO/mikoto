import { faCrown } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Box } from '@mikoto-io/lucid';
import { Member, Space } from 'mikotojs';
import { useEffect, useRef, useState } from 'react';
import { useSetRecoilState } from 'recoil';
import styled from 'styled-components';

import { computeRoleColor } from '../../functions/roleFunctions';
import { useMikoto } from '../../hooks';
import { contextMenuState, useContextMenu } from '../ContextMenu';
import { Avatar } from '../atoms/Avatar';
import { MemberContextMenu } from '../atoms/MessageAvatar';
import { UserContextMenu } from '../modals/ContextMenus';

const StyledMember = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 8px;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;

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
  const setContextMenu = useSetRecoilState(contextMenuState);
  const elemRef = useRef<HTMLDivElement>(null);

  const userContextMenu = useContextMenu(() => (
    <UserContextMenu user={member.user} />
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
          elem: <MemberContextMenu space={space} user={member.user} />,
        });
      }}
      onContextMenu={userContextMenu}
    >
      <Avatar size={32} src={member.user.avatar ?? undefined} />
      <Box className="name" txt={computeRoleColor(space, member)}>
        {member.user.name}
      </Box>
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
