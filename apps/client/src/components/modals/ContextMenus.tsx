import { MikotoMember, UserExt } from '@mikoto-io/mikoto.js';
import { permissions } from '@mikoto-io/permcheck';
import { useSetAtom } from 'jotai';

import { ContextMenu, modalState } from '@/components/ContextMenu';
import { ProfileModal } from '@/components/modals/Profile';

interface UserContextMenuProps {
  user: UserExt;
  member?: MikotoMember;
}

export function UserContextMenu({ user, member }: UserContextMenuProps) {
  const setModal = useSetAtom(modalState);

  return (
    <ContextMenu>
      <ContextMenu.Link
        onClick={() => {
          setModal({
            elem: <ProfileModal user={user} />,
          });
        }}
      >
        Profile
      </ContextMenu.Link>
      {member && member.checkPermission(permissions.ban) && (
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
