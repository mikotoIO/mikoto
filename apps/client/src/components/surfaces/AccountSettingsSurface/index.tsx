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
import { observer } from 'mobx-react-lite';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import styled from 'styled-components';

import { useAuthClient, useMikoto } from '../../../hooks';
import { useErrorElement } from '../../../hooks/useErrorElement';
import { SettingsView } from '../../../views/SettingsViewTemplate';
import { modalState } from '../../ContextMenu';
import { userState } from '../../UserArea';
import {
  AvatarEditor,
  mediaServerAxios,
  uploadFileWithAxios,
} from '../../molecules/AvatarEditor';
import { BaseSettingsSurface } from '../BaseSettingSurface';
import { BotsSurface } from './bots';
import { LanguageSurface } from './language';
import { ThemesSubsurface } from './themes';

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

function NameChangeModal() {
  const { register, handleSubmit } = useForm();
  const mikoto = useMikoto();
  const setModal = useSetRecoilState(modalState);

  return (
    <Modal>
      <Form
        onSubmit={handleSubmit(async (form) => {
          await mikoto.client.users.update({
            options: {
              name: form.name,
              avatar: null,
            },
          });
          setModal(null);
        })}
      >
        <Input labelName="New Name" {...register('name')} />
        <Button type="submit" variant="primary">
          Change Name
        </Button>
      </Form>
    </Modal>
  );
}

const Overview = observer(() => {
  const setModal = useSetRecoilState(modalState);
  const { t } = useTranslation();

  const mikoto = useMikoto();
  const user = mikoto.me;

  return (
    <SettingsView>
      <h1>{t('accountSettings.general.title')}</h1>
      <Form>
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
                  options: {
                    avatar: data.url,
                    name: null,
                  },
                });
              }}
            />
            <h2>{user?.name}</h2>
          </Content>
          <Box p={16}>
            <Button
              type="button"
              onClick={() => {
                setModal({
                  elem: <NameChangeModal />,
                });
              }}
            >
              Edit Name
            </Button>
          </Box>
        </AccountInfo>
        <TextArea h={160} labelName="Bio" />
        <Button variant="primary">Save</Button>
      </Form>

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
      <Box p={{ bottom: 16 }}>
        Warning: This action is irreversible. You will lose all your data.
      </Box>
      <Buttons>
        <Button variant="danger">
          {t('accountSettings.general.deleteAccount')}
        </Button>
      </Buttons>
      <h2>Debug</h2>
      <Button>Open Design Palette</Button>
      <Box m={{ bottom: 80 }} />
    </SettingsView>
  );
});
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
    case 'themes':
      return <ThemesSubsurface />;
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
  { code: 'themes', tkey: 'accountSettings.themes.title' },
];

export function AccountSettingsSurface() {
  return (
    <BaseSettingsSurface
      defaultNav="general"
      categories={ACCOUNT_SETTING_CATEGORIES}
      switcher={(nav) => <Switch nav={nav} />}
    />
  );
}
