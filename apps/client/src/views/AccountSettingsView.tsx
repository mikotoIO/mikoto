import { TextInput } from '@mantine/core';
import { useForm } from 'react-hook-form';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import styled from 'styled-components';

import { modalState } from '../components/ContextMenu';
import { TabName } from '../components/TabBar';
import { userState } from '../components/UserArea';
import {
  AvatarEditor,
  mediaServerAxios,
  uploadFileWithAxios,
} from '../components/molecules/AvatarEditor';
import { useMikoto } from '../hooks';
import { useErrorElement } from '../hooks/useErrorElement';
import { Button } from '../lucid/Button';
import { DialogPanel } from '../lucid/DialogPanel';
import { Form } from '../lucid/Form';
import { Input } from '../lucid/Input';
import { SettingsView } from './SettingsViewTemplate';

const bgUrl = 'https://i1.sndcdn.com/visuals-000328863415-MJdwB0-t2480x520.jpg';

const Banner = styled.div`
  border-radius: 8px;
  background-color: ${(p) => p.theme.colors.B700};
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
  const mikoto = useMikoto();
  const user = useRecoilValue(userState);

  const { register, handleSubmit, getValues } = useForm();
  const error = useErrorElement();

  return (
    <DialogPanel>
      <Form
        style={{ minWidth: 400 }}
        onSubmit={handleSubmit(async (form) => {
          try {
            await mikoto.authAPI.changePassword(
              user!.id,
              form.oldPassword,
              form.newPassword,
            );
            window.location.href = '/login';
          } catch (e) {
            error.setError((e as any)?.response?.data);
          }
        })}
      >
        <h1>Change Password</h1>
        {error.el}

        <Input
          labelName="Old Password"
          type="password"
          {...register('oldPassword', { required: true })}
        />

        <Input
          labelName="New Password"
          type="password"
          {...register('newPassword', { required: true })}
        />

        <Input
          labelName="Confirm New Password"
          type="password"
          {...register('confirmNewPassword', {
            required: true,
            validate: (value) => value === getValues('newPassword'),
          })}
        />

        <Button variant="primary" type="submit">
          Change Password
        </Button>
      </Form>
    </DialogPanel>
  );
}

function BotsSegment() {
  return (
    <div>
      <Button variant="primary">Create Bot</Button>
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
      <div>
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
      </div>
      <h2>Bots</h2>
      <BotsSegment />
    </SettingsView>
  );
}
