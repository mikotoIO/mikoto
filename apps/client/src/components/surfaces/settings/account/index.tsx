import {
  Box,
  Code,
  Flex,
  Group,
  Heading,
  Input,
  Text,
  Textarea,
} from '@chakra-ui/react';
import { VerificationChallenge } from '@mikoto-io/mikoto.js';
import { useAtomValue, useSetAtom } from 'jotai';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { modalState } from '@/components/ContextMenu';
import { userState } from '@/components/UserArea';
import { AvatarEditor } from '@/components/molecules/AvatarEditor';
import { BaseSettingsSurface } from '@/components/surfaces/BaseSettings';
import { Button, DialogContent, Field } from '@/components/ui';
import { Alert } from '@/components/ui/alert';
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

  const { register, handleSubmit, getValues } = useForm();
  const error = useErrorElement();

  return (
    <DialogContent rounded="md" p={4} maxW="480px">
      <Form
        style={{ minWidth: 400 }}
        onSubmit={handleSubmit(async (form) => {
          try {
            await authClient.changePassword({
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

        <Field label="Old Password">
          <Input
            type="password"
            {...register('oldPassword', { required: true })}
          />
        </Field>
        <Field label="New Password">
          <Input
            type="password"
            {...register('newPassword', { required: true })}
          />
        </Field>
        <Field label="Confirm New Password">
          <Input
            type="password"
            {...register('confirmNewPassword', {
              required: true,
              validate: (value) => value === getValues('newPassword'),
            })}
          />
        </Field>

        <Button colorPalette="primary" type="submit">
          Change Password
        </Button>
      </Form>
    </DialogContent>
  );
}

function NameChangeModal() {
  const { register, handleSubmit } = useForm();
  const mikoto = useMikoto();
  const setModal = useSetAtom(modalState);

  return (
    <DialogContent rounded="md" p={4} maxW="480px">
      <Form
        onSubmit={handleSubmit(async (form) => {
          await mikoto.rest['user.update']({ name: form.name }, {});
          setModal(null);
        })}
      >
        <Field label="New Name">
          <Input autoComplete="off" {...register('name')} />
        </Field>
        <Button type="submit" colorPalette="primary">
          Change Name
        </Button>
      </Form>
    </DialogContent>
  );
}

function HandleVerificationModal({
  challenge,
  onVerify,
}: {
  challenge: VerificationChallenge;
  onVerify: () => Promise<void>;
}) {
  const setModal = useSetAtom(modalState);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async () => {
    setVerifying(true);
    setError(null);
    try {
      await onVerify();
      setModal(null);
    } catch (e: unknown) {
      const errorMessage =
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'Verification failed. Please try again.';
      setError(errorMessage);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <DialogContent rounded="md" p={4} maxW="600px">
      <h1>Verify Domain Ownership</h1>
      <Text color="gray.400" fontSize="sm" mb={4}>
        To use <strong>{challenge.handle}</strong> as your handle, you need to
        verify that you own this domain using one of the methods below.
      </Text>

      <Box bg="gray.800" p={4} rounded="md" mb={4}>
        <Text fontWeight="bold" mb={2}>
          Option 1: DNS TXT Record
        </Text>
        <Text fontSize="sm" color="gray.400" mb={2}>
          Add a TXT record to your domain&apos;s DNS settings:
        </Text>
        <Field label="Record Name">
          <Code
            p={2}
            w="100%"
            display="block"
            bg="gray.900"
            fontSize="sm"
            wordBreak="break-all"
          >
            {challenge.dnsTxtName}
          </Code>
        </Field>
        <Field label="Record Value" mt={2}>
          <Code
            p={2}
            w="100%"
            display="block"
            bg="gray.900"
            fontSize="sm"
            wordBreak="break-all"
          >
            {challenge.dnsTxtRecord}
          </Code>
        </Field>
      </Box>

      <Box bg="gray.800" p={4} rounded="md" mb={4}>
        <Text fontWeight="bold" mb={2}>
          Option 2: Well-Known File
        </Text>
        <Text fontSize="sm" color="gray.400" mb={2}>
          Create a file at the following URL with the content below:
        </Text>
        <Field label="URL">
          <Code
            p={2}
            w="100%"
            display="block"
            bg="gray.900"
            fontSize="sm"
            wordBreak="break-all"
          >
            {challenge.wellKnownUrl}
          </Code>
        </Field>
        <Field label="File Content" mt={2}>
          <Code
            p={2}
            w="100%"
            display="block"
            bg="gray.900"
            fontSize="sm"
            whiteSpace="pre-wrap"
            wordBreak="break-all"
          >
            {challenge.wellKnownContent}
          </Code>
        </Field>
      </Box>

      {error && (
        <Alert status="error" mb={4} title="Verification Failed">
          {error}
        </Alert>
      )}

      <Group>
        <Button
          colorPalette="primary"
          onClick={handleVerify}
          loading={verifying}
        >
          Verify Domain
        </Button>
        <Button variant="ghost" onClick={() => setModal(null)}>
          Cancel
        </Button>
      </Group>
    </DialogContent>
  );
}

function Overview() {
  const setModal = useSetAtom(modalState);
  const { t } = useTranslation();

  const mikoto = useMikoto();
  const user = mikoto.user.me!;
  const [userHandle, setUserHandle] = useState(user?.handle ?? '');
  const [handleLoading, setHandleLoading] = useState(false);
  const handleError = useErrorElement();
  const { register, handleSubmit } = useForm({
    defaultValues: {
      description: user?.description || '',
    },
  });

  // Check if a handle looks like a custom domain (contains . but is not a default handle)
  const isCustomDomain = (handle: string) => {
    if (!handle.includes('.')) return false;
    // Default handles end with the instance domain (e.g., .mikoto.io)
    // Custom domains are anything else with a dot
    const parts = handle.split('.');
    // If it's just username.domain.tld (3 parts) and ends with mikoto.io, it's a default handle
    // Otherwise treat as custom domain
    return !(parts.length === 3 && handle.endsWith('.mikoto.io'));
  };

  const handleSaveHandle = async () => {
    if (!userHandle.trim()) {
      await mikoto.rest['user.deleteHandle'](undefined, {});
      return;
    }

    setHandleLoading(true);
    handleError.setError(null);

    try {
      if (isCustomDomain(userHandle)) {
        // Custom domain - start verification flow
        const challenge = await mikoto.rest['user.startHandleVerification'](
          { handle: userHandle },
          {},
        );

        setModal({
          elem: (
            <HandleVerificationModal
              challenge={challenge}
              onVerify={async () => {
                const result = await mikoto.rest[
                  'user.completeHandleVerification'
                ]({ handle: userHandle }, {});
                if (!result.success) {
                  throw new Error(
                    result.error ??
                      'Verification failed. Please check your DNS or well-known file.',
                  );
                }
              }}
            />
          ),
        });
      } else {
        // Simple username or default handle - set directly
        await mikoto.rest['user.setHandle']({ handle: userHandle }, {});
      }
    } catch (e: unknown) {
      const errorMessage =
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'Failed to update handle';
      handleError.setError({ name: 'HandleError', message: errorMessage });
    } finally {
      setHandleLoading(false);
    }
  };

  return (
    <SettingSurface>
      <h1>{t('accountSettings.general.title')}</h1>
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
          <Flex ml="16px" gap={1} pt={2} direction="column">
            <Heading as="h2" fontSize="2xl" mb={0}>
              {user?.name}
            </Heading>
            {user?.handle && (
              <Text color="gray.400" fontSize="sm" mt={0} fontFamily="mono">
                @{user.handle}
              </Text>
            )}
          </Flex>
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

      <h2>Handle</h2>
      <Text color="gray.400" fontSize="sm" mb={2}>
        Your handle is your unique identifier. Use a simple username (e.g.,
        &quot;hayley&quot;) or verify a custom domain (e.g.,
        &quot;hayley.moe&quot;).
      </Text>
      {handleError.el}
      <Form
        mb={4}
        onSubmit={async (e) => {
          e.preventDefault();
          await handleSaveHandle();
        }}
      >
        <Field label="Handle">
          <Input
            value={userHandle}
            onChange={(e) => setUserHandle(e.target.value)}
            placeholder="your-handle or your-domain.com"
          />
        </Field>
        {userHandle && isCustomDomain(userHandle) && (
          <Text fontSize="xs" color="blue.300" mt={1}>
            This looks like a custom domain. You&apos;ll need to verify
            ownership.
          </Text>
        )}
        <Group mt={2}>
          <Button colorPalette="primary" type="submit" loading={handleLoading}>
            {userHandle && isCustomDomain(userHandle)
              ? 'Verify & Save Handle'
              : 'Save Handle'}
          </Button>
          {user?.handle && (
            <Button
              variant="outline"
              colorPalette="red"
              type="button"
              onClick={async () => {
                await mikoto.rest['user.deleteHandle'](undefined, {});
                setUserHandle('');
              }}
            >
              Release Handle
            </Button>
          )}
        </Group>
      </Form>

      <Form
        mb={4}
        onSubmit={handleSubmit(async (form) => {
          await mikoto.rest['user.update'](
            { description: form.description },
            {},
          );
        })}
      >
        <Field label="Bio" mt={4} fontSize="">
          <Textarea
            placeholder="A little bit about yourself, what you like, your socials, etc. Markdown is supported!"
            autoComplete="off"
            h={160}
            {...register('description')}
          />
        </Field>
        <Button colorPalette="blue" type="submit">
          Save
        </Button>
      </Form>

      <h2>{t('accountSettings.general.authentication')}</h2>

      <Flex gap={2}>
        <Button
          variant="subtle"
          onClick={() => {
            setModal({
              elem: <PasswordChangeModal />,
            });
          }}
        >
          {t('accountSettings.general.changePassword')}
        </Button>
        <Button
          colorPalette="yellow"
          type="submit"
          height="auto"
          blockSize="auto"
        >
          {t('accountSettings.general.logOutOfAllDevices')}
        </Button>
      </Flex>
      <h2>{t('accountSettings.general.dangerous')}</h2>
      <Box pb="16px">
        Warning: This action is irreversible. You will lose all your data.
      </Box>
      <Flex gap={2}>
        <Button colorPalette="red">
          {t('accountSettings.general.deleteAccount')}
        </Button>
      </Flex>
      <h2>Debug</h2>
      <Text color="gray.400" fontSize="sm" mb={2} fontFamily="mono">
        Commit: {__COMMIT_HASH__}
      </Text>
      <Button size="md" variant="subtle">
        Open Design Palette
      </Button>
      <Box mb="80px" />
    </SettingSurface>
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
