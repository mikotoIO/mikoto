import { Button, TextInput } from '@mantine/core';
import axios, { AxiosInstance } from 'axios';
import { useDropzone } from 'react-dropzone';
import { useRecoilState, useSetRecoilState } from 'recoil';
import styled from 'styled-components';

import { modalState } from '../components/ContextMenu';
import { TabName } from '../components/TabBar';
import { userState } from '../components/UserArea';
import {
  AvatarEditor,
  mediaServerAxios,
  uploadFileWithAxios,
} from '../components/molecules/AvatarEditor';
import { env } from '../env';
import { useMikoto } from '../hooks';
import { SettingsView } from './SettingsViewTemplate';

const bgUrl = 'https://i1.sndcdn.com/visuals-000328863415-MJdwB0-t2480x520.jpg';

const Banner = styled.div`
  border-radius: 8px;
  background-color: ${(p) => p.theme.colors.B800};
  height: 160px;
  background: url('${bgUrl}') no-repeat center center;
  background-size: cover;
`;

const AccountInfo = styled.div`
  border-radius: 8px;
  background-color: ${(p) => p.theme.colors.N900};
  width: 100%;
  max-width: 600px;
`;

const Content = styled.div`
  padding: 16px;
  display: flex;
  align-items: center;
  h2 {
    margin-left: 32px;
  }
`;

export function PasswordChangeModal() {
  return (
    <div>
      <TextInput label="Current Password" type="password" />
      <TextInput label="New Password" type="password" />
      <TextInput label="Confirm New Password" type="password" />
    </div>
  );
}

export function AccountSettingsView() {
  const setModal = useSetRecoilState(modalState);

  const mikoto = useMikoto();
  const [user] = useRecoilState(userState);

  return (
    <SettingsView>
      <TabName name="Account Settings" />
      <h1>My Account</h1>
      <AccountInfo>
        <Banner />
        <Content>
          <AvatarEditor
            avatar={user?.avatar ?? undefined}
            onDrop={async (file) => {
              const { data } = await uploadFileWithAxios<{ url: string }>(
                mediaServerAxios,
                '/avatar',
                file,
              );
              await mikoto.client.users.update({
                avatar: data.url,
                name: null,
              });
            }}
          />
          <h2>{user?.name}</h2>
        </Content>
      </AccountInfo>
      <h2>Authentication</h2>
      <Button
        onClick={() => {
          setModal({
            title: 'Change Password',
            elem: <PasswordChangeModal />,
          });
        }}
      >
        Change Password
      </Button>
    </SettingsView>
  );
}
