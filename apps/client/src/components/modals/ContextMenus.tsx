import { MikotoMember, User } from '@mikoto-io/mikoto.js';
import { permissions } from '@mikoto-io/permcheck';

import { ContextMenu } from '@/components/ContextMenu';
import { useTabkit } from '@/store/surface';

interface UserContextMenuProps {
  user: User;
  member?: MikotoMember;
}

export function UserContextMenu({ user, member }: UserContextMenuProps) {
  const tabkit = useTabkit();

  return (
    <ContextMenu>
      <ContextMenu.Link
        onClick={() => {
          tabkit.openTab({
            kind: 'profile',
            key: user.id,
            user,
          });
        }}
      >
        Profile
      </ContextMenu.Link>
      {member &&
        member.space?.member?.userId !== member.userId &&
        member.space?.member?.checkPermission(permissions.ban) && (
        <ContextMenu.Link
          onClick={async () => {
            await member.kick();
          }}
        >
          Kick {user.name}
        </ContextMenu.Link>
      )}
    </ContextMenu>
  );
}
