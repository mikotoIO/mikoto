import { Flex, Heading } from '@chakra-ui/react';
import { User } from 'mikotojs';
import { useEffect } from 'react';
import { atom, useRecoilState } from 'recoil';

import { useMikoto } from '../hooks';
import { useModalKit } from '../store';
import { useTabkit } from '../store/surface';
import { ContextMenu, useContextMenu } from './ContextMenu';
import { Avatar } from './atoms/Avatar';
import { SetStatusModal } from './modals/Status';

export const userState = atom<User | null>({
  default: null,
  key: 'user',
});

function UserAreaMenuItems() {
  const tabkit = useTabkit();
  const modal = useModalKit();
  const mikoto = useMikoto();

  return (
    <>
      <ContextMenu.Link
        onClick={() => {
          tabkit.openTab({ kind: 'welcome', key: 'welcome' }, false);
        }}
      >
        Open Welcome
      </ContextMenu.Link>
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
          navigator.clipboard.writeText(mikoto.me.id);
        }}
      >
        Copy My User ID
      </ContextMenu.Link>
      <ContextMenu.Link
        onClick={() => {
          localStorage.removeItem('REFRESH_TOKEN');
          window.location.reload();
        }}
      >
        Log out
      </ContextMenu.Link>
    </>
  );
}

function UserAreaMenu() {
  const mikoto = useMikoto();

  return (
    <ContextMenu style={{ width: '280px' }}>
      <Flex gap={2} bg="gray.800" p="16px" rounded="md" direction="column">
        <Avatar src={mikoto.me.avatar ?? undefined} size={80} />
        <Heading fontSize="18px" mb={0}>
          {mikoto.me.name}
        </Heading>
      </Flex>
      <UserAreaMenuItems />
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
    mikoto.client.users.me({}).then(setUser);
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
