import { Flex, Heading } from '@chakra-ui/react';
import { User } from '@mikoto-io/mikoto.js';
import { useEffect } from 'react';
import { atom, useRecoilState } from 'recoil';

import { ContextMenu, useContextMenu } from '@/components/ContextMenu';
import { Avatar } from '@/components/atoms/Avatar';
import { SetStatusModal } from '@/components/modals/Status';
import { useMikoto } from '@/hooks';
import { useModalKit } from '@/store';
import { useTabkit } from '@/store/surface';

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
          tabkit.openTab({ kind: 'accountSettings', key: 'main' });
        }}
      >
        User Settings
      </ContextMenu.Link>
      <ContextMenu.Link
        onClick={() => {
          if (mikoto.user.me) {
            navigator.clipboard.writeText(mikoto.user.me.id);
          }
        }}
      >
        Copy My User ID
      </ContextMenu.Link>
      <ContextMenu.Link
        onClick={() => {
          tabkit.openTab({
            kind: 'spaceInvite',
            key: 'spaceInvite/derp',
            inviteCode: 'derp',
          });
        }}
      >
        Test Button :3
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
  const user = mikoto.user.me;

  return (
    <ContextMenu style={{ width: '280px' }}>
      {user && (
        <Flex gap={2} bg="gray.800" p="16px" rounded="md" direction="column">
          <Avatar src={user.avatar ?? undefined} size={80} />
          <Heading fontSize="18px" mb={0}>
            {user.name}
          </Heading>
        </Flex>
      )}
      <UserAreaMenuItems />
    </ContextMenu>
  );
}

export function UserAreaAvatar() {
  const mikoto = useMikoto();
  const [user, setUser] = useRecoilState(userState);
  const contextMenu = useContextMenu(() => <UserAreaMenu />, {
    top: 32,
    left: 64,
  });
  useEffect(() => {
    mikoto.rest['user.get']().then((x) => {
      setUser(x);
    });
  }, []);

  return (
    user && (
      <Avatar size={40} onClick={contextMenu} src={user.avatar ?? undefined} />
    )
  );
}
