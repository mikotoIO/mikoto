import React, { useEffect } from 'react';
import styled from 'styled-components';
import { atom, useRecoilState } from 'recoil';
import { Avatar } from './atoms/Avatar';
import { useMikoto } from '../api';
import { User } from '../models';
import { useTabkit } from '../store';
import { ContextMenu, useContextMenu } from './ContextMenu';

const StyledSidebar = styled.div`
  display: grid;
  grid-template-rows: 1fr 64px;
  width: 270px;
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
          tabkit.openTab(
            {
              kind: 'accountSettings',
              name: 'Account Settings',
              key: 'accountSettings',
            },
            false,
          );
        }}
      >
        User Settings
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
    mikoto.getCurrentUser().then(setUser);
  }, []);

  return (
    <StyledUserArea onClick={contextMenu}>
      {user && (
        <>
          <Avatar src={user.avatar} />
          <StyledUserInfo>
            <h1>{user.name}</h1>
            <h2>Tinkering on stuff</h2>
          </StyledUserInfo>
        </>
      )}
    </StyledUserArea>
  );
}

export function Sidebar({ children }: { children: React.ReactNode }) {
  return (
    <StyledSidebar>
      {children}
      <UserArea />
    </StyledSidebar>
  );
}
