import { permissions } from '@mikoto-io/permcheck';
import { ClientMember, User, checkMemberPermission } from 'mikotojs';
import { useSetRecoilState } from 'recoil';

import { ContextMenu, modalState } from '@/components/ContextMenu';
import { ProfileModal } from '@/components/modals/Profile';

interface UserContextMenuProps {
  user: User;
  member?: ClientMember;
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
      {member &&
        checkMemberPermission(member.space.member!, permissions.ban) && (
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
