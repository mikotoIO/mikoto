import type { MikotoMember, MikotoRole, User } from '@mikoto-io/mikoto.js';
import { permissions } from '@mikoto-io/permcheck';
import { useSetAtom } from 'jotai';
import { Bot, Crown, Pencil } from 'lucide-react';
import { useRef, useState } from 'react';

import {
  contextMenuState,
  modalState,
  useContextMenu,
} from '@/components/ContextMenu';
import { UserContextMenu } from '@/components/modals/ContextMenus';
import { ProfileModal } from '@/components/modals/Profile';
import {
  Checkbox,
  IconButton,
  RoleName,
  Tag,
  describeError,
  toast,
} from '@/design';
import { useMaybeSnapshot } from '@/hooks';

import { Avatar } from '../Avatar';
import styles from './MessageAvatar.module.css';
import { RoleBadge } from './RoleBadge';
import { roleNameProps, sortedRoles } from './roles';

export { RoleBadge } from './RoleBadge';
export { roleNameProps, sortedRoles } from './roles';

function RoleSetter({
  roles,
  member,
}: {
  roles: MikotoRole[];
  member: MikotoMember;
}) {
  const [checked, setChecked] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(roles.map((r) => [r.id, member.roleIds.includes(r.id)])),
  );

  const toggle = async (role: MikotoRole, on: boolean) => {
    setChecked((c) => ({ ...c, [role.id]: on }));
    const params = {
      params: {
        spaceId: member.spaceId,
        userId: member.user.id,
        roleId: role.id,
      },
    };
    try {
      if (on) {
        await member.client.rest['members.addRole'](undefined, params);
      } else {
        await member.client.rest['members.removeRole'](undefined, params);
      }
    } catch (err) {
      setChecked((c) => ({ ...c, [role.id]: !on }));
      toast({
        type: 'error',
        title: on
          ? `Couldn't add the ${role.name} role`
          : `Couldn't remove the ${role.name} role`,
        description: describeError(err, { context: 'action' }).message,
      });
    }
  };

  return (
    <div className={styles.card}>
      <p className={styles.sectionLabel}>Roles for {member.user.name}</p>
      <div className={styles.roleList}>
        {roles
          .filter((role) => role.name !== '@everyone')
          .toSorted((a, b) => b.position - a.position)
          .map((role) => (
            <Checkbox
              key={role.id}
              checked={checked[role.id] ?? false}
              onCheckedChange={(on) => toggle(role, on)}
              label={role.name}
            />
          ))}
      </div>
    </div>
  );
}

/** The small profile card that opens when you click an avatar or member. */
export function MemberContextMenu({
  user,
  member,
}: {
  user: User;
  member?: MikotoMember;
}) {
  const memberSnap = useMaybeSnapshot(member);
  const setModal = useSetAtom(modalState);
  const setContextMenu = useSetAtom(contextMenuState);
  const [roleEditorOpen, setRoleEditorOpen] = useState(false);

  const roles = sortedRoles(member);
  const canManageRoles =
    member?.space?.member?.checkPermission(permissions.manageRoles) ?? false;
  const spaceRoles = member?.space ? member.space.roles.values() : [];
  const handle =
    member?.user.handle ??
    ('handle' in user && typeof user.handle === 'string' ? user.handle : null);

  const openProfile = () => {
    setModal({ elem: <ProfileModal user={user} member={member} /> });
    setContextMenu(null);
  };

  return (
    <div className={styles.stack}>
      <div className={styles.card} role="dialog" aria-label={user.name}>
        <div className={styles.identity}>
          <Avatar
            src={user.avatar}
            userId={user.id}
            name={user.name}
            size={56}
            onClick={openProfile}
            title="View profile"
          />
          <div className={styles.names}>
            <span className={styles.name}>
              <RoleName name={user.name} {...roleNameProps(member)} />
              {memberSnap?.isOwner && (
                <Crown size={14} aria-label="Space owner" />
              )}
              {user.category === 'BOT' && (
                <Tag>
                  <Bot size={12} aria-hidden />
                  Bot
                </Tag>
              )}
            </span>
            {handle && <span className={styles.handle}>@{handle}</span>}
          </div>
        </div>
        {member && (
          <div className={styles.section}>
            <p className={styles.sectionLabel}>Roles</p>
            <div className={styles.roles}>
              {roles.length === 0 && (
                <span className={styles.empty}>No roles</span>
              )}
              {roles.map((r) => (
                <RoleBadge key={r.id} role={r} />
              ))}
              {canManageRoles && (
                <IconButton
                  aria-label="Edit roles"
                  aria-pressed={roleEditorOpen}
                  onClick={() => setRoleEditorOpen((x) => !x)}
                >
                  <Pencil size={14} />
                </IconButton>
              )}
            </div>
          </div>
        )}
      </div>
      {member && roleEditorOpen && (
        <RoleSetter roles={spaceRoles} member={member} />
      )}
    </div>
  );
}

interface MessageAvatarProps {
  src?: string;
  /** Pixel size. Omit to follow the density token (`--av`). */
  size?: number;
  user?: User;
  member?: MikotoMember;
}

/**
 * An avatar that, when clicked, shows the member's profile card.
 */
export function MessageAvatar({
  src,
  member,
  size,
  user: userProp,
}: MessageAvatarProps) {
  const setContextMenu = useSetAtom(contextMenuState);
  const avatarRef = useRef<HTMLButtonElement>(null);
  useMaybeSnapshot(member);

  const user = member?.user ?? userProp;

  const userContextMenu = useContextMenu(() =>
    user ? <UserContextMenu user={user} member={member} /> : null,
  );

  return (
    <button
      type="button"
      ref={avatarRef}
      className={styles.trigger}
      aria-label={user ? `Show ${user.name}'s profile` : 'Unknown user'}
      disabled={!user}
      onContextMenu={user ? userContextMenu : undefined}
      onClick={(ev) => {
        if (!user || avatarRef.current === null) return;
        ev.preventDefault();
        ev.stopPropagation();
        const { top, right } = avatarRef.current.getBoundingClientRect();
        setContextMenu({
          position: { top, left: right + 8 },
          elem: <MemberContextMenu member={member} user={user} />,
        });
      }}
    >
      <Avatar
        src={src}
        userId={user?.id}
        name={user?.name}
        size={size ?? 40}
        style={size === undefined ? { '--size': 'var(--av)' } : undefined}
        aria-hidden
      />
    </button>
  );
}
