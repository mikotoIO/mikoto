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
import { useAsync } from 'react-async-hook';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import styled from 'styled-components';

import { useAuthClient, useMikoto } from '../../hooks';
import { useErrorElement } from '../../hooks/useErrorElement';
import { SettingsView } from '../../views/SettingsViewTemplate';
import { modalState } from '../ContextMenu';
import { TabName } from '../TabBar';
import { userState } from '../UserArea';
import {
  AvatarEditor,
  mediaServerAxios,
  uploadFileWithAxios,
} from '../molecules/AvatarEditor';

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
  const { t } = useTranslation();

  const { result: bots } = useAsync(() => authClient.listBots(), []);

  return (
    <SettingsView>
      <TabName name={t('accountSettings.bots.title')} />
      <h1>{t('accountSettings.bots.title')}</h1>
      <Button
        variant="primary"
        onClick={() => {
          setModal({
            elem: <BotCreateModal />,
          });
        }}
      >
        {t('accountSettings.bots.createBot')}{' '}
      </Button>
      {bots && bots.map((bot) => <BotCard key={bot.id} {...bot} />)}
    </SettingsView>
  );
}

const languages = [
  { name: 'English', code: 'en' },
  { name: '日本語', code: 'ja' },
  { name: '한국어', code: 'ko' },
];

const LanguageSelect = styled(Box)`
  cursor: pointer;
`;

function LanguageSurface() {
  const { t, i18n } = useTranslation();
  const [language, setLanguage] = useState(
    localStorage.getItem('language') ?? 'en',
  );

  return (
    <SettingsView>
      <TabName name={t('accountSettings.language.title')} />
      <h1>{t('accountSettings.language.title')}</h1>
      <div>
        {languages.map((lang) => (
          <LanguageSelect
            w="100%"
            key={lang.code}
            bg={lang.code === language ? 'N600' : 'N1000'}
            p={12}
            m={8}
            rounded={4}
            onClick={() => {
              setLanguage(lang.code);
              localStorage.setItem('language', lang.code);
              i18n.changeLanguage(lang.code);
            }}
          >
            {lang.name}
          </LanguageSelect>
        ))}
      </div>
    </SettingsView>
  );
}

export function Overview() {
  const setModal = useSetRecoilState(modalState);
  const { t } = useTranslation();

  const mikoto = useMikoto();
  const [user] = useRecoilState(userState);

  return (
    <SettingsView>
      <TabName name={t('accountSettings.general.title')} />
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

function Switch({ nav }: { nav: string }) {
  switch (nav) {
    case 'general':
      return <Overview />;
    case 'bots':
      return <BotsSurface />;
    case 'language':
      return <LanguageSurface />;
    default:
      return null;
  }
}

const ACCOUNT_SETTING_CATEGORIES = [
  { code: 'general', tkey: 'accountSettings.general.title' },
  { code: 'bots', tkey: 'accountSettings.bots.title' },
  { code: 'language', tkey: 'accountSettings.language.title' },
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
      <Switch nav={nav} />
    </SettingsView.Container>
  );
}
