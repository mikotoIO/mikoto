import { useState } from 'react';
import { useAsync } from 'react-async-hook';
import { useForm } from 'react-hook-form';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import styled from 'styled-components';

import { useAuthClient, useMikoto } from '../../hooks';
import { useErrorElement } from '../../hooks/useErrorElement';
import { Input, Form, Button, Buttons, Modal } from '../../lucid';
import { SettingsView } from '../../views/SettingsViewTemplate';
import { modalState } from '../ContextMenu';
import { TabName } from '../TabBar';
import { userState } from '../UserArea';
import {
  AvatarEditor,
  mediaServerAxios,
  uploadFileWithAxios,
} from '../molecules/AvatarEditor';

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
  const authClient = useAuthClient();
  const user = useRecoilValue(userState);

  const { register, handleSubmit, getValues } = useForm();
  const error = useErrorElement();

  return (
    <Modal>
      <Form
        style={{ minWidth: 400 }}
        onSubmit={handleSubmit(async (form) => {
          try {
            await authClient.changePassword(
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
    </Modal>
  );
}

const BotCardContainer = styled.div`
  background-color: var(--N1000);
  margin: 16px 0;
  padding: 16px;
  border-radius: 8px;
  width: 800px;
  max-width: 100%;
  box-sizing: border-box;
`;

interface BotProps {
  id: string;
  name: string;
  secret: string;
}

function BotCard({ id, name, secret }: BotProps) {
  return (
    <BotCardContainer>
      <h2>{name}</h2>
      <p>Bot ID: {id}</p>
      <Button
        onClick={() => {
          navigator.clipboard.writeText(`${id}:${secret}`);
        }}
      >
        Copy ID:Secret Pair
      </Button>
    </BotCardContainer>
  );
}

function BotCreateModal() {
  const authClient = useAuthClient();
  const { register, handleSubmit } = useForm();
  const setModal = useSetRecoilState(modalState);

  return (
    <Modal>
      <Form
        onSubmit={handleSubmit(async (form) => {
          await authClient.createBot(form.name);
          setModal(null);
        })}
      >
        <h1>Create Bot</h1>
        <Input labelName="Bot Name" {...register('name', { required: true })} />
        <Button variant="primary" type="submit">
          Create Bot
        </Button>
      </Form>
    </Modal>
  );
}

function BotsSurface() {
  const authClient = useAuthClient();
  const setModal = useSetRecoilState(modalState);

  const { result: bots } = useAsync(() => authClient.listBots(), []);

  return (
    <SettingsView>
      <h1>Bots</h1>
      <Button
        variant="primary"
        onClick={() => {
          setModal({
            elem: <BotCreateModal />,
          });
        }}
      >
        Create Bot
      </Button>
      {bots && bots.map((bot) => <BotCard key={bot.id} {...bot} />)}
    </SettingsView>
  );
}

export function Overview() {
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

      <Buttons>
        <Button
          onClick={() => {
            setModal({
              elem: <PasswordChangeModal />,
            });
          }}
        >
          Change Password
        </Button>
        <Button variant="warning" type="submit">
          Log out of all devices
        </Button>
      </Buttons>
      <h2>Dangerous</h2>
      <Buttons>
        <Button variant="danger">Delete Account</Button>
      </Buttons>
    </SettingsView>
  );
}

function Switch({ nav }: { nav: string }) {
  switch (nav) {
    case 'Account':
      return <Overview />;
    case 'Bots and API':
      return <BotsSurface />;
    default:
      return null;
  }
}

const ACCOUNT_SETTING_CATEGORIES = [
  'Account',
  'Bots and API',
  // 'Billing',
  // 'Notifications',
  // 'Themes',
  // 'Security',
];

export function AccountSettingsSurface() {
  const [nav, setNav] = useState('Account');
  return (
    <SettingsView.Container>
      <SettingsView.Sidebar>
        {ACCOUNT_SETTING_CATEGORIES.map((c) => (
          <SettingsView.Nav
            active={nav === c}
            onClick={() => {
              setNav(c);
            }}
            key={c}
          >
            {c}
          </SettingsView.Nav>
        ))}
      </SettingsView.Sidebar>
      <Switch nav={nav} />
    </SettingsView.Container>
  );
}
