import { User } from 'mikotojs';
import { useEffect } from 'react';
import { atom, useRecoilState } from 'recoil';

import { useMikoto } from '../hooks';
import { useModalKit, useTabkit } from '../store';
import { ContextMenu, useContextMenu } from './ContextMenu';
import { Avatar } from './atoms/Avatar';
import { SetStatusModal } from './modals/Status';

export const userState = atom<User | null>({
  default: null,
  key: 'user',
});

function UserAreaMenu() {
  const tabkit = useTabkit();
  const modal = useModalKit();

  return (
    <ContextMenu>
      <ContextMenu.Link
        onClick={() => {
          tabkit.openTab({ kind: 'palette', key: 'main' }, false);
        }}
      >
        Open Palette
      </ContextMenu.Link>
      <ContextMenu.Link
        onClick={() => {
          modal(<SetStatusModal />);
        }}
      >
        Set Status
      </ContextMenu.Link>
      <ContextMenu.Link
        onClick={() => {
          tabkit.openTab({ kind: 'accountSettings', key: 'main' }, false);
        }}
      >
        User Settings
      </ContextMenu.Link>
      <ContextMenu.Link
        onClick={() => {
          localStorage.removeItem('REFRESH_TOKEN');
          window.location.reload();
        }}
      >
        Log out
      </ContextMenu.Link>
    </ContextMenu>
  );
}

export function UserAreaAvatar() {
  const mikoto = useMikoto();
  const [user, setUser] = useRecoilState(userState);
  const contextMenu = useContextMenu(() => <UserAreaMenu />, {
    top: 48,
    left: 80,
  });
  useEffect(() => {
    mikoto.client.users.me().then(setUser);
  }, []);

  return (
    user && (
      <Avatar
        size={28}
        style={{ marginTop: '6px' }}
        onClick={contextMenu}
        src={user.avatar ?? undefined}
      />
    )
  );
}
