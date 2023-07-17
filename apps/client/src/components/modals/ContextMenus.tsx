import { User } from 'mikotojs';
import { useSetRecoilState } from 'recoil';

import { ContextMenu, modalState } from '../ContextMenu';
import { ProfileModal } from './Profile';

export function UserContextMenu({ user }: { user: User }) {
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
      <ContextMenu.Link>Kick {user.name}</ContextMenu.Link>
    </ContextMenu>
  );
}
