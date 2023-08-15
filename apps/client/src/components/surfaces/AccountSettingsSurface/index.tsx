import {
  Input,
  Form,
  Button,
  Buttons,
  Modal,
  Box,
  backgroundMix,
  Flex,
  TextArea,
} from '@mikoto-io/lucid';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import styled from 'styled-components';

import { useAuthClient, useMikoto } from '../../../hooks';
import { useErrorElement } from '../../../hooks/useErrorElement';
import { SettingsView } from '../../../views/SettingsViewTemplate';
import { modalState } from '../../ContextMenu';
import { TabName } from '../../TabBar';
import { userState } from '../../UserArea';
import {
  AvatarEditor,
  mediaServerAxios,
  uploadFileWithAxios,
} from '../../molecules/AvatarEditor';
import { BotsSurface } from './bots';
import { LanguageSurface } from './language';

const bgUrl = '/images/artworks/1.jpg';

const AccountInfo = styled(Box)`
  max-width: 600px;
`;

const Content = styled(Flex)`
  align-items: center;
  h2 {
    margin-left: 32px;
  }
`;

export function PasswordChangeModal() {
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

export function Overview() {
  const setModal = useSetRecoilState(modalState);
  const { t } = useTranslation();

  const mikoto = useMikoto();
  const [user] = useRecoilState(userState);

  return (
    <SettingsView>
      <h1>{t('accountSettings.general.title')}</h1>
      <AccountInfo rounded={8} bg="N900" w="100%">
        <Box txt="B700" h={160} mix={[backgroundMix(bgUrl)]} rounded={8} />
        <Content p={16}>
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
      <TextArea h={160} labelName="Bio" />
      <h2>{t('accountSettings.general.authentication')}</h2>

      <Buttons>
        <Button
          onClick={() => {
            setModal({
              elem: <PasswordChangeModal />,
            });
          }}
        >
          {t('accountSettings.general.changePassword')}
        </Button>
        <Button variant="warning" type="submit">
          {t('accountSettings.general.logOutOfAllDevices')}
        </Button>
      </Buttons>
      <h2>{t('accountSettings.general.dangerous')}</h2>
      <Buttons>
        <Button variant="danger">
          {t('accountSettings.general.deleteAccount')}
        </Button>
      </Buttons>
    </SettingsView>
  );
}

function NotificationSubsurface() {
  const { t } = useTranslation();

  return (
    <SettingsView>
      <h1>{t('accountSettings.notifications.title')}</h1>
    </SettingsView>
  );
}

function Switch({ nav }: { nav: string }) {
  switch (nav) {
    case 'general':
      return <Overview />;
    case 'bots':
      return <BotsSurface />;
    case 'language':
      return <LanguageSurface />;
    case 'notifications':
      return <NotificationSubsurface />;
    default:
      return null;
  }
}

const ACCOUNT_SETTING_CATEGORIES = [
  { code: 'general', tkey: 'accountSettings.general.title' },
  { code: 'bots', tkey: 'accountSettings.bots.title' },
  { code: 'language', tkey: 'accountSettings.language.title' },
  { code: 'notifications', tkey: 'accountSettings.notifications.title' },
  { code: 'connections', tkey: 'accountSettings.connections.title' },
];

export function AccountSettingsSurface() {
  const [nav, setNav] = useState('general');
  const { t } = useTranslation();

  return (
    <SettingsView.Container>
      <SettingsView.Sidebar>
        {ACCOUNT_SETTING_CATEGORIES.map((c) => (
          <SettingsView.Nav
            active={nav === c.code}
            onClick={() => {
              setNav(c.code);
            }}
            key={c.code}
          >
            {t(c.tkey)}
          </SettingsView.Nav>
        ))}
      </SettingsView.Sidebar>
      <TabName
        name={t(ACCOUNT_SETTING_CATEGORIES.find((x) => x.code === nav)?.tkey!)}
      />
      <Switch nav={nav} />
    </SettingsView.Container>
  );
}