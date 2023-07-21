import { User } from 'mikotojs';
import { Resizable } from 're-resizable';
import React, { useEffect } from 'react';
import { atom, useRecoilState } from 'recoil';
import styled from 'styled-components';

import { useMikoto } from '../hooks';
import { useTabkit } from '../store';
import { ContextMenu, useContextMenu } from './ContextMenu';
import { Avatar } from './atoms/Avatar';

const StyledSidebarInner = styled.div`
  display: grid;
  height: 100%;
`;

const StyledUserArea = styled.div`
  padding-left: 16px;
  display: flex;
  align-items: center;
  height: 64px;
  background-color: ${(p) => p.theme.colors.N1000};
`;

const StyledUserInfo = styled.div`
  margin-left: 10px;
  h1,
  h2 {
    margin: 2px;
  }
  h1 {
    font-size: 16px;
  }
  h2 {
    font-size: 12px;
    font-weight: normal;
  }
`;

export const userState = atom<User | null>({
  default: null,
  key: 'user',
});

function UserAreaMenu() {
  const tabkit = useTabkit();

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

export function UserArea() {
  const mikoto = useMikoto();
  const [user, setUser] = useRecoilState(userState);
  const contextMenu = useContextMenu(() => <UserAreaMenu />, {
    bottom: 72,
    left: 80,
  });
  useEffect(() => {
    mikoto.client.users.me().then(setUser);
  }, []);

  return (
    <StyledUserArea onClick={contextMenu}>
      {user && (
        <>
          <Avatar src={user.avatar ?? undefined} />
          <StyledUserInfo>
            <h1>{user.name}</h1>
            <h2>Tinkering on stuff</h2>
          </StyledUserInfo>
        </>
      )}
    </StyledUserArea>
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

export function ExplorerWrapper({ children }: { children: React.ReactNode }) {
  return (
    <StyledSidebarInner>
      <div>{children}</div>
    </StyledSidebarInner>
  );
}
