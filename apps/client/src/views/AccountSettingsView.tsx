import styled from 'styled-components';
import { useDropzone } from 'react-dropzone';
import { useRecoilState } from 'recoil';
import { SettingsView } from './SettingsViewTemplate';
import { Avatar } from '../components/atoms/Avatar';
import { useMikoto } from '../api';
import { userState } from '../components/UserArea';
import { TabName } from '../components/TabBar';

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

const AvatarWrapper = styled.a``;

export function AccountSettingsView() {
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
          </AvatarWrapper>
          <h2>{user?.name}</h2>
        </Content>
      </AccountInfo>
    </SettingsView>
  );
}
