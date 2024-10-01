import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Input,
  ModalContent,
  Textarea,
} from '@chakra-ui/react';
import { observer } from 'mobx-react-lite';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useRecoilValue, useSetRecoilState } from 'recoil';

import { modalState } from '@/components/ContextMenu';
import { userState } from '@/components/UserArea';
import { AvatarEditor } from '@/components/molecules/AvatarEditor';
import { BaseSettingsSurface } from '@/components/surfaces/BaseSettings';
import { uploadFile } from '@/functions/fileUpload';
import { useAuthClient, useMikoto } from '@/hooks';
import { useErrorElement } from '@/hooks/useErrorElement';
import { Form } from '@/ui';
import { SettingSurface } from '@/views';

import { BotsSurface } from './bots';
import { LanguageSurface } from './language';
import { NotificationSurface } from './notification';
import { SafetySurface } from './safety';
import { ThemesSubsurface } from './themes';

const bgUrl = '/images/artworks/2.jpg';

export function PasswordChangeModal() {
  const authClient = useAuthClient();
  const user = useRecoilValue(userState);

  const { register, handleSubmit, getValues } = useForm();
  const error = useErrorElement();

  return (
    <ModalContent rounded="md" p={4} maxW="480px">
      <Form
        style={{ minWidth: 400 }}
        onSubmit={handleSubmit(async (form) => {
          try {
            await authClient.changePassword({
              id: user!.id,
              oldPassword: form.oldPassword,
              newPassword: form.newPassword,
            });
            window.location.href = '/login';
          } catch (e) {
            error.setError((e as any)?.response?.data);
          }
        })}
      >
        <h1>Change Password</h1>
        {error.el}

        <FormControl>
          <FormLabel>Old Password</FormLabel>
          <Input
            type="password"
            {...register('oldPassword', { required: true })}
          />
        </FormControl>
        <FormControl>
          <FormLabel>New Password</FormLabel>
          <Input
            type="password"
            {...register('newPassword', { required: true })}
          />
        </FormControl>
        <FormControl>
          <FormLabel>Confirm New Password</FormLabel>
          <Input
            type="password"
            {...register('confirmNewPassword', {
              required: true,
              validate: (value) => value === getValues('newPassword'),
            })}
          />
        </FormControl>

        <Button variant="primary" type="submit">
          Change Password
        </Button>
      </Form>
    </ModalContent>
  );
}

function NameChangeModal() {
  const { register, handleSubmit } = useForm();
  const mikoto = useMikoto();
  const setModal = useSetRecoilState(modalState);

  return (
    <ModalContent rounded="md" p={4} maxW="480px">
      <Form
        onSubmit={handleSubmit(async (form) => {
          await mikoto.rest['user.update']({ name: form.name }, {});
          setModal(null);
        })}
      >
        <FormControl>
          <FormLabel>New Name</FormLabel>
          <Input {...register('name')} />
        </FormControl>
        <Button type="submit" variant="primary">
          Change Name
        </Button>
      </Form>
    </ModalContent>
  );
}

const Overview = observer(() => {
  const setModal = useSetRecoilState(modalState);
  const { t } = useTranslation();

  const mikoto = useMikoto();
  const user = mikoto.user.me!;

  return (
    <SettingSurface>
      <h1>{t('accountSettings.general.title')}</h1>
      <Form>
        <Box rounded={8} bg="gray.800" w="100%" maxW="600px">
          <Box
            h={40}
            bg={`url(${bgUrl}) no-repeat center center`}
            bgSize="cover"
            rounded={8}
          />
          <Flex p="16px" align="center">
            <AvatarEditor
              avatar={user?.avatar ?? undefined}
              onDrop={async (file) => {
                const { data } = await uploadFile('/avatar', file);
                await mikoto.rest['user.update']({ avatar: data.url }, {});
              }}
            />
            <Heading as="h2" ml="16px" fontSize="2xl">
              {user?.name}
            </Heading>
          </Flex>
          <Box p={4}>
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
        </Box>
        <FormControl>
          <FormLabel>Bio</FormLabel>
          <Textarea h={160} />
        </FormControl>
        <Button variant="primary">Save</Button>
      </Form>

      <h2>{t('accountSettings.general.authentication')}</h2>

      <Flex gap={2}>
        <Button
          onClick={() => {
            setModal({
              elem: <PasswordChangeModal />,
            });
          }}
        >
          {t('accountSettings.general.changePassword')}
        </Button>
        <Button variant="warning" type="submit" height="auto" blockSize="auto">
          {t('accountSettings.general.logOutOfAllDevices')}
        </Button>
      </Flex>
      <h2>{t('accountSettings.general.dangerous')}</h2>
      <Box pb="16px">
        Warning: This action is irreversible. You will lose all your data.
      </Box>
      <Flex gap={2}>
        <Button variant="danger">
          {t('accountSettings.general.deleteAccount')}
        </Button>
      </Flex>
      <h2>Debug</h2>
      <Button size="md">Open Design Palette</Button>
      <Box mb="80px" />
    </SettingSurface>
  );
});

function Switch({ nav }: { nav: string }) {
  switch (nav) {
    case 'general':
      return <Overview />;
    case 'bots':
      return <BotsSurface />;
    case 'language':
      return <LanguageSurface />;
    case 'notifications':
      return <NotificationSurface />;
    case 'themes':
      return <ThemesSubsurface />;
    case 'safety':
      return <SafetySurface />;
    default:
      return null;
  }
}

const ACCOUNT_SETTING_CATEGORIES = [
  { code: 'general', tkey: 'accountSettings.general.title' },
  { code: 'safety', tkey: 'accountSettings.safety.title' },
  { code: 'notifications', tkey: 'accountSettings.notifications.title' },
  { code: 'bots', tkey: 'accountSettings.bots.title' },
  { code: 'language', tkey: 'accountSettings.language.title' },
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
