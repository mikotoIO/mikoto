import { Checkbox } from '@mantine/core';
import { Flex } from '@mikoto-io/lucid';
import { Member, Role, Space, User } from 'mikotojs';
import { useContext, useEffect, useRef, useState } from 'react';
import { useSetRecoilState } from 'recoil';
import styled from 'styled-components';

import { useMikoto } from '../../hooks';
import { CurrentSpaceContext } from '../../store';
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
  background-color: ${(p) => p.theme.colors.N1100};
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

const StyledRoleBadge = styled.div`
  display: inline-block;
  padding: 4px 8px;
  background: ${(p) => p.theme.colors.B800};
  color: ${(p) => p.theme.colors.N0};
  border-radius: 4px;

  font-size: 12px;
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
  border: 1px solid ${(p) => p.theme.colors.N0};
  background-color: ${(p) => p.theme.colors.N800};
  color: ${(p) => p.theme.colors.N0};
  border-radius: 4px;

  font-size: 12px;
`;

export function MemberContextMenu({
  user,
  space,
}: {
  user: User;
  space?: Space;
}) {
  const mikoto = useMikoto();
  const [member, setMember] = useState<Member | null>(null);
  const setModal = useSetRecoilState(modalState);

  useEffect(() => {
    if (space) {
      mikoto.client.members.get(space.id, user.id).then(setMember);
    }
  }, [user.id]);

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
            <h2>Roles</h2>
            <div style={{ display: 'flex', gap: '8px' }}>
              {member.roleIds.map((r) => {
                const role = space?.roles.find((x) => x.id === r);
                return role && <RoleBadge key={r} role={role} />;
              })}
              <StyledPlusBadge
                onClick={() => {
                  setRoleEditorOpen((x) => !x);
                }}
              >
                +
              </StyledPlusBadge>
            </div>
          </div>
        )}
      </AvatarContextWrapper>
      {roleEditorOpen && <RoleSetter roles={space?.roles!} member={member!} />}
    </div>
  );
}

interface MessageAvatarProps extends AvatarProps {
  user?: User;
}

export function MessageAvatar({ src, user, size }: MessageAvatarProps) {
  const setContextMenu = useSetRecoilState(contextMenuState);
  const avatarRef = useRef<HTMLImageElement>(null);
  const space = useContext(CurrentSpaceContext);

  const userContextMenu = useContextMenu(() => (
    <UserContextMenu user={user!} />
  ));

  return (
    <Avatar
      className="avatar"
      src={src ?? '/images/default_avatar.png'}
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
          elem: <MemberContextMenu user={user} space={space} />,
        });
      }}
    />
  );
}
