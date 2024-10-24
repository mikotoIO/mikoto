import { MikotoMember, User } from '@mikoto-io/mikoto.js';
import { permissions } from '@mikoto-io/permcheck';
import { useSetRecoilState } from 'recoil';

import { ContextMenu, modalState } from '@/components/ContextMenu';
import { ProfileModal } from '@/components/modals/Profile';

interface UserContextMenuProps {
  user: User;
  member?: MikotoMember;
}

export function UserContextMenu({ user, member }: UserContextMenuProps) {
  const setModal = useSetRecoilState(modalState);

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
