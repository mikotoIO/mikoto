import { MikotoMember, User } from '@mikoto-io/mikoto.js';
import { permissions } from '@mikoto-io/permcheck';
import { useSetAtom } from 'jotai';

import { ContextMenu, modalState } from '@/components/ContextMenu';
import { ProfileModal } from '@/components/modals/Profile';

interface UserContextMenuProps {
  user: User;
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
      {member &&
        member.space?.member?.userId !== member.userId &&
        member.space?.member?.checkPermission(permissions.ban) && (
        <>
          <ContextMenu.Link
            onClick={async () => {
              await member.kick();
            }}
          >
            Kick {user.name}
          </ContextMenu.Link>
          <ContextMenu.Link
            onClick={async () => {
              await member.ban();
            }}
          >
            Ban {user.name}
          </ContextMenu.Link>
        </>
      )}
    </ContextMenu>
  );
}
