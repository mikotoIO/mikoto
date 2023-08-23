import { Checkbox } from '@mantine/core';
import { Flex } from '@mikoto-io/lucid';
import { permissions } from '@mikoto-io/permcheck';
import {
  ClientMember,
  Member,
  Role,
  User,
  checkMemberPermission,
} from 'mikotojs';
import { observer } from 'mobx-react-lite';
import { useRef, useState } from 'react';
import { useSetRecoilState } from 'recoil';
import styled from 'styled-components';

import { useMikoto } from '../../hooks';
import { contextMenuState, modalState, useContextMenu } from '../ContextMenu';
import { UserContextMenu } from '../modals/ContextMenus';
import { ProfileModal } from '../modals/Profile';
import { Avatar } from './Avatar';
import { RoleBadge } from './RoleBadge';

interface AvatarProps {
  src?: string;
  size?: number;
}

const AvatarContextWrapper = styled.div`
  position: relative;
  background-color: var(--N1100);
  color: white;
  padding: 16px;
  border-radius: 4px;
  width: 300px;

  h1 {
    font-size: 20px;
    margin-top: 0;
  }

  hr {
    opacity: 0.1;
  }

  h2 {
    font-size: 16px;
  }
`;

function RoleSetter({ roles, member }: { roles: Role[]; member: Member }) {
  const mikoto = useMikoto();

  const [selectedRoles, setSelectedRoles] = useState<Record<string, boolean>>(
    () => {
      const o: Record<string, boolean> = {};
      roles.forEach((role) => {
        if (role.name === '@everyone') return;
        o[role.id] = member.roleIds.includes(role.id);
      });
      return o;
    },
  );

  return (
    <AvatarContextWrapper>
      <Flex dir="column" gap={8}>
        {roles.map((x) => {
          if (x.name === '@everyone') return null;
          return (
            <Checkbox
              label={x.name}
              key={x.id}
              checked={selectedRoles[x.id]}
              onChange={async (e) => {
                const newSelectedRoles = {
                  ...selectedRoles,
                  [x.id]: e.currentTarget.checked,
                };
                setSelectedRoles(newSelectedRoles);

                await mikoto.client.members.update(
                  member.spaceId,
                  member.user.id,
                  {
                    roleIds: Object.keys(newSelectedRoles).filter(
                      (id) => newSelectedRoles[id],
                    ),
                  },
                );
              }}
            />
          );
        })}
      </Flex>
    </AvatarContextWrapper>
  );
}

const StyledPlusBadge = styled.div`
  display: inline-block;
  padding: 4px 8px;
  border: 1px solid var(--N0);
  background-color: var(--N800);
  color: var(--N0);
  border-radius: 4px;

  font-size: 12px;
`;

export const MemberContextMenu = observer(
  ({ user, member }: { user: User; member?: ClientMember }) => {
    const setModal = useSetRecoilState(modalState);

    const [roleEditorOpen, setRoleEditorOpen] = useState(false);
    const setContextMenu = useSetRecoilState(contextMenuState);

    return (
      <div style={{ display: 'grid', gridGap: '8px' }}>
        <AvatarContextWrapper>
          {member === null ? (
            'loading'
          ) : (
            <div>
              <Avatar
                src={user.avatar ?? undefined}
                size={80}
                onClick={() => {
                  setModal({
                    elem: <ProfileModal user={user} />,
                  });
                  setContextMenu(null);
                }}
              />
              <h1>{user.name}</h1>
              <hr />
              {member && (
                <>
                  <h2>Roles</h2>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {member.roles.map(
                      (r) => r && <RoleBadge key={r.id} role={r} />,
                    )}
                    {checkMemberPermission(
                      member.space.member!,
                      permissions.manageRoles,
                    ) && (
                      <StyledPlusBadge
                        onClick={() => {
                          setRoleEditorOpen((x) => !x);
                        }}
                      >
                        +
                      </StyledPlusBadge>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </AvatarContextWrapper>
        {member && roleEditorOpen && (
          <RoleSetter roles={member.space?.roles!} member={member!} />
        )}
      </div>
    );
  },
);

interface MessageAvatarProps extends AvatarProps {
  user?: User;
  member?: ClientMember;
}

export function MessageAvatar({ src, member, size }: MessageAvatarProps) {
  const setContextMenu = useSetRecoilState(contextMenuState);
  const avatarRef = useRef<HTMLImageElement>(null);

  const user = member?.user;

  const userContextMenu = useContextMenu(() => (
    <UserContextMenu user={user!} />
  ));

  return (
    <Avatar
      className="avatar"
      src={src ? `${src}?w=40&h=40` : '/images/default_avatar.png'}
      size={size ?? 40}
      ref={avatarRef}
      onContextMenu={user && userContextMenu}
      onClick={(ev) => {
        if (!user) return;
        ev.preventDefault();
        ev.stopPropagation();
        if (avatarRef.current === null) return;
        const { top, right } = avatarRef.current.getBoundingClientRect();

        setContextMenu({
          position: { top, left: right + 8 },
          elem: <MemberContextMenu member={member} user={user} />,
        });
      }}
    />
  );
}
