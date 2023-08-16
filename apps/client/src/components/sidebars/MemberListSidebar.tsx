import { faCrown } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Box } from '@mikoto-io/lucid';
import { ClientMember, ClientSpace } from 'mikotojs';
import { observer } from 'mobx-react-lite';
import { useEffect, useRef, useState } from 'react';
import { useSetRecoilState } from 'recoil';
import styled from 'styled-components';

import { contextMenuState, useContextMenu } from '../ContextMenu';
import { Avatar } from '../atoms/Avatar';
import { MemberContextMenu } from '../atoms/MessageAvatar';
import { UserContextMenu } from '../modals/ContextMenus';
import { useFetchMember } from '../../hooks';

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

const MemberElement = observer(({ member }: { member: ClientMember }) => {
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
          elem: <MemberContextMenu member={member} user={member.user} />,
        });
      }}
      onContextMenu={userContextMenu}
    >
      <Avatar size={32} src={member.user.avatar ?? undefined} />
      <Box className="name" txt={member.roleColor}>
        {member.user.name}
      </Box>
      {member.isSpaceOwner && (
        <FontAwesomeIcon className="crown" icon={faCrown} />
      )}
    </StyledMember>
  );
});

export const MemberListSidebar = observer(
  ({ space }: { space: ClientSpace }) => {
    useFetchMember(space);

    return (
      <div>
        <Divider>Members</Divider>
        {space.members &&
          Array.from(space.members.values()).map((x) => (
            <MemberElement key={x.id} member={x} />
          ))}
      </div>
    );
  },
);
