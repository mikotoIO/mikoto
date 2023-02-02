import { Button, TextInput } from '@mantine/core';
import { useDropzone } from 'react-dropzone';
import { useRecoilState, useSetRecoilState } from 'recoil';
import styled from 'styled-components';

import { modalState } from '../components/ContextMenu';
import { TabName } from '../components/TabBar';
import { userState } from '../components/UserArea';
import { Avatar } from '../components/atoms/Avatar';
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

const AvatarWrapper = styled.a`
  position: relative;
`;
const AvatarHover = styled.div`
  position: absolute;
  top: 0;
  border-radius: 7px;
  text-align: center;
  width: 64px;
  height: 64px;
  opacity: 0;
  font-size: 10px;
  font-weight: bold;

  display: flex;
  justify-content: center;
  align-items: center;
  :hover {
    opacity: 1;
    background-color: rgba(0, 0, 0, 0.6);
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

  const avatarUpload = useDropzone({
    onDrop: (files) => {
      mikoto.uploadAvatar(files[0]).then(() => {
        console.log('nice');
      });
    },
  });

  return (
    <SettingsView>
      <TabName name="Account Settings" />
      <h1>My Account</h1>
      <AccountInfo>
        <Banner />
        <Content>
          <AvatarWrapper
            onClick={() => {
              avatarUpload.open();
            }}
          >
            <Avatar size={64} src={user?.avatar} />
            <AvatarHover>CHANGE{'\n'}AVATAR</AvatarHover>
          </AvatarWrapper>
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
