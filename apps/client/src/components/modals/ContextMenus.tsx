import { permissions } from '@mikoto-io/permcheck';
import { ClientMember, User, checkMemberPermission } from 'mikotojs';
import { useSetRecoilState } from 'recoil';

import { useMikoto } from '../../hooks';
import { ContextMenu, modalState } from '../ContextMenu';
import { ProfileModal } from './Profile';

interface UserContextMenuProps {
  user: User;
  member?: ClientMember;
}

export function UserContextMenu({ user, member }: UserContextMenuProps) {
  const setModal = useSetRecoilState(modalState);
  const mikoto = useMikoto();

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
              await mikoto.client.members.delete(member.spaceId, member.userId);
            }}
          >
            Kick {user.name}
          </ContextMenu.Link>
        )}
    </ContextMenu>
  );
}
