import { Button, Checkbox } from '@mantine/core';
import { ClientMember, ClientRole, ClientSpace } from 'mikotojs';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { useSetRecoilState } from 'recoil';
import styled from 'styled-components';

import { useMikoto } from '../../hooks';
import { User } from '../../models';
import { CurrentSpaceContext } from '../../store';
import { contextMenuState } from '../ContextMenu';
import { RoleBadge } from './RoleBadge';

const AvatarImg = styled.img<{ size: number }>`
  user-select: none;
  width: ${(p) => p.size}px;
  height: ${(p) => p.size}px;
  border-radius: 8px;
`;

interface AvatarProps {
  src?: string;
  size?: number;
}

export function Avatar({ src, size }: AvatarProps) {
  return (
    <AvatarImg src={src ?? '/images/default_avatar.png'} size={size ?? 40} />
  );
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

function RoleSetter({
  roles,
  member,
}: {
  roles: ClientRole[];
  member: ClientMember;
}) {
  const [selectedRoles, setSelectedRoles] = useState<Record<string, boolean>>(
    () => {
      const o: Record<string, boolean> = {};
      for (const role of roles) {
        if (role.name === '@everyone') continue;
        o[role.id] = false;
      }
      return o;
    },
  );

  return (
    <AvatarContextWrapper>
      {roles.map((x) => {
        if (x.name === '@everyone') return null;
        return (
          <Checkbox
            label={x.name}
            key={x.id}
            checked={selectedRoles[x.id]}
            onChange={(e) => {
              setSelectedRoles({
                ...selectedRoles,
                [x.id]: e.currentTarget.checked,
              });
            }}
          />
        );
      })}
      <Button
        onClick={() => {
          member.update({
            roleIds: Object.keys(selectedRoles).filter(
              (id) => selectedRoles[id],
            ),
          });
        }}
      >
        Set Roles
      </Button>
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

function AvatarContextMenu({
  user,
  space,
}: {
  user: User;
  space?: ClientSpace;
}) {
  const mikoto = useMikoto();
  const [member, setMember] = useState<ClientMember | null>(null);
  React.useEffect(() => {
    if (space) {
      mikoto.getMember(space.id, user.id).then(setMember);
    }
  }, [user.id]);

  const [roleEditorOpen, setRoleEditorOpen] = useState(false);

  return (
    <div style={{ display: 'grid', gridGap: '8px' }}>
      <AvatarContextWrapper>
        {member === null ? (
          'loading'
        ) : (
          <div>
            <Avatar src={user.avatar} size={80} />
            <h1>{user.name}</h1>
            <hr />
            <h2>Roles</h2>
            <div style={{ display: 'flex', gap: '8px' }}>
              {member.roleIds.map((r) => {
                const role = space?.roles.get(r);
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
      {roleEditorOpen && (
        <RoleSetter roles={space!.roles.list()} member={member!} />
      )}
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

  return (
    <AvatarImg
      src={src ?? '/images/default_avatar.png'}
      size={size ?? 40}
      ref={avatarRef}
      onClick={(ev) => {
        if (!user) return;
        ev.preventDefault();
        ev.stopPropagation();
        if (avatarRef.current === null) return;
        const { top, right } = avatarRef.current.getBoundingClientRect();

        setContextMenu({
          position: { top, left: right + 8 },
          elem: <AvatarContextMenu user={user} space={space} />,
        });
      }}
    />
  );
}
