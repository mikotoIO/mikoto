import { Box, Checkbox, Flex } from '@chakra-ui/react';
import styled from '@emotion/styled';
import { MikotoMember, Role, User } from '@mikoto-io/mikoto.js';
import { permissions } from '@mikoto-io/permcheck';
import { useRef, useState } from 'react';
import { useSetRecoilState } from 'recoil';

import {
  contextMenuState,
  modalState,
  useContextMenu,
} from '@/components/ContextMenu';
import { UserContextMenu } from '@/components/modals/ContextMenus';
import { ProfileModal } from '@/components/modals/Profile';
import { useMikoto } from '@/hooks';

import { Avatar } from '../Avatar';
import { BaseRoleBadge, RoleBadge } from './RoleBadge';

interface AvatarProps {
  src?: string;
  size?: number;
}

const AvatarContextWrapper = styled.div`
  position: relative;
  background-color: var(--chakra-colors-gray-900);
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

function RoleSetter({
  roles,
  member,
}: {
  roles: Role[];
  member: MikotoMember;
}) {
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
      <Flex direction="column" gap={8}>
        {roles.map((role) => {
          if (role.name === '@everyone') return null;
          return (
            <Checkbox
              key={role.id}
              checked={selectedRoles[role.id]}
              onChange={async (e) => {
                console.log(role);
                console.log(e.currentTarget.checked);

                if (e.currentTarget.checked) {
                  await member.client.rest['members.addRole'](undefined, {
                    params: {
                      spaceId: member.spaceId,
                      userId: member.user.id,
                      roleId: role.id,
                    },
                  });
                } else {
                  await member.client.rest['members.removeRole'](undefined, {
                    params: {
                      spaceId: member.spaceId,
                      userId: member.user.id,
                      roleId: role.id,
                    },
                  });
                }

                // await member.update({
                //   roleIds: Object.keys(newSelectedRoles).filter(
                //     (id) => newSelectedRoles[id],
                //   ),
                // });
              }}
            >
              {role.name}
            </Checkbox>
          );
        })}
      </Flex>
    </AvatarContextWrapper>
  );
}

export function MemberContextMenu({
  user,
  member,
}: {
  user: User;
  member?: MikotoMember;
}) {
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
                <Box gap={2}>
                  {member.roles.map(
                    (r) => r && <RoleBadge key={r.id} role={r} />,
                  )}
                  {member.checkPermission(permissions.manageRoles) && (
                    <BaseRoleBadge
                      cursor="pointer"
                      onClick={() => setRoleEditorOpen((x) => !x)}
                    >
                      +
                    </BaseRoleBadge>
                  )}
                </Box>
              </>
            )}
          </div>
        )}
      </AvatarContextWrapper>
      {member && roleEditorOpen && (
        <RoleSetter roles={member.space?.roles!.values()!} member={member!} />
      )}
    </div>
  );
}

interface MessageAvatarProps extends AvatarProps {
  user?: User;
  member?: MikotoMember;
}

/**
 * An avatar that when clicked, shows a user profile menu.
 */
export function MessageAvatar({ src, member, size }: MessageAvatarProps) {
  const setContextMenu = useSetRecoilState(contextMenuState);
  const avatarRef = useRef<HTMLDivElement>(null);

  const user = member?.user;

  const userContextMenu = useContextMenu(() => (
    <UserContextMenu user={user!} member={member} />
  ));

  return (
    <Box ref={avatarRef}>
      <Avatar
        className="avatar"
        src={src}
        size={size ?? 40}
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
    </Box>
  );
}
