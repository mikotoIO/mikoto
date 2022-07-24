import React, { useEffect } from 'react';
import styled from 'styled-components';
import { atom, useRecoilState } from 'recoil';
import { Avatar } from './atoms/Avatar';
import { useMikoto } from '../api';
import { User } from '../models';
import { useTabkit } from '../store';

const SidebarElement = styled.div`
  display: grid;
  grid-template-rows: 1fr 64px;
  width: 270px;
  height: 100%;
`;

const UserAreaItem = styled.div`
  padding-left: 16px;
  display: flex;
  align-items: center;
  height: 64px;
  background-color: ${(p) => p.theme.colors.N1000};
`;

const UserInfo = styled.div`
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

export function UserArea() {
  const mikoto = useMikoto();
  const tabkit = useTabkit();
  const [user, setUser] = useRecoilState(userState);
  useEffect(() => {
    mikoto.getCurrentUser().then(setUser);
  }, []);

  return (
    <UserAreaItem
      onClick={() => {
        tabkit.openTab(
          {
            kind: 'accountSettings',
            name: 'User Settings',
            key: 'accountSettings',
          },
          true,
        );
        console.log('userarea click');
      }}
    >
      {user && (
        <>
          <Avatar src={user.avatar} />
          <UserInfo>
            <h1>{user.name}</h1>
            <h2>Tinkering on stuff</h2>
          </UserInfo>
        </>
      )}
    </UserAreaItem>
  );
}

export function Sidebar({ children }: { children: React.ReactNode }) {
  return (
    <SidebarElement>
      {children}
      <UserArea />
    </SidebarElement>
  );
}
