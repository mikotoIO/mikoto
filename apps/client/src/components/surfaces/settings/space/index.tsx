import { Box, Code, Group, Input, Text } from '@chakra-ui/react';
import { MikotoSpace, VerificationChallenge } from '@mikoto-io/mikoto.js';
import { useSetAtom } from 'jotai';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useSnapshot } from 'valtio';

import { modalState } from '@/components/ContextMenu';
import { AvatarEditor } from '@/components/molecules/AvatarEditor';
import { BaseSettingsSurface } from '@/components/surfaces/BaseSettings';
import { Button, DialogContent, Field } from '@/components/ui';
import { Alert } from '@/components/ui/alert';
import { uploadFile } from '@/functions/fileUpload';
import { useMikoto } from '@/hooks';
import { useErrorElement } from '@/hooks/useErrorElement';
import { Form } from '@/ui';
import { SettingSurface } from '@/views';

import { BansSubsurface } from './Bans';
import { EmojiSubsurface } from './Emojis';
import { Invites } from './Invites';
import { RolesSubsurface } from './Roles';

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
        To use <strong>{challenge.handle}</strong> as this space&apos;s handle,
        you need to verify that you own this domain using one of the methods
        below.
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

function AddBotModal({ space }: { space: MikotoSpace }) {
  const form = useForm();
  const mikoto = useMikoto();
  const setModal = useSetAtom(modalState);
  return (
    <DialogContent rounded="md" p={4} maxW="480px">
      <Form
        onSubmit={form.handleSubmit(async (data) => {
          await mikoto.rest['members.create'](
            {
              userId: data.botId,
            },
            {
              params: {
                spaceId: space.id,
              },
            },
          );
          setModal(null);
        })}
      >
        <Field label="Bot ID">
          <Input autoComplete="off" {...form.register('botId')} />
        </Field>
        <Button type="submit" colorPalette="primary">
          Submit
        </Button>
      </Form>
    </DialogContent>
  );
}

function Overview({ space }: { space: MikotoSpace }) {
  const { t } = useTranslation();
  const mikoto = useMikoto();
  const [spaceName, setSpaceName] = useState(space.name);
  const [spaceHandle, setSpaceHandle] = useState(space.handle ?? '');
  const [handleLoading, setHandleLoading] = useState(false);
  const handleError = useErrorElement();
  const setModal = useSetAtom(modalState);
  const spaceSnap = useSnapshot(space);

  const isCustomDomain = (handle: string) => {
    if (!handle.includes('.')) return false;
    const parts = handle.split('.');
    return !(parts.length === 3 && handle.endsWith('.mikoto.io'));
  };

  const handleSaveHandle = async () => {
    if (!spaceHandle.trim()) {
      await space.edit({ handle: null });
      return;
    }

    setHandleLoading(true);
    handleError.setError(null);

    try {
      if (isCustomDomain(spaceHandle)) {
        const challenge = await mikoto.rest['spaces.startHandleVerification'](
          { handle: spaceHandle },
          { params: { spaceId: space.id } },
        );

        setModal({
          elem: (
            <HandleVerificationModal
              challenge={challenge}
              onVerify={async () => {
                const result = await mikoto.rest[
                  'spaces.completeHandleVerification'
                ]({ handle: spaceHandle }, { params: { spaceId: space.id } });
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
        await space.edit({ handle: spaceHandle });
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
      <Form maxW="480px" display="flex" gap={2} mb={4}>
        <h1>{t('spaceSettings.spaceOverview')}</h1>
        <AvatarEditor
          avatar={spaceSnap.icon ?? undefined}
          onDrop={async (file) => {
            const { data } = await uploadFile('/spaceicon', file);

            await space.edit({
              icon: data.url,
            });
          }}
        />

        <Field label="Space Name">
          <Input
            autoComplete="off"
            value={spaceName}
            onChange={(x) => setSpaceName(x.target.value)}
          />
        </Field>

        <Button
          colorPalette="primary"
          type="button"
          onClick={async () => {
            await space.edit({ name: spaceName });
          }}
        >
          Update Name
        </Button>
      </Form>

      <h2>Handle</h2>
      <Text color="gray.400" fontSize="sm" mb={2}>
        Your space&apos;s handle is its unique identifier. Use a simple name
        (e.g., &quot;my-space&quot;) or verify a custom domain (e.g.,
        &quot;community.example.com&quot;).
      </Text>
      {handleError.el}
      <Form
        mb={4}
        maxW="480px"
        onSubmit={async (e) => {
          e.preventDefault();
          await handleSaveHandle();
        }}
      >
        <Field label="Handle">
          <Input
            value={spaceHandle}
            onChange={(e) => setSpaceHandle(e.target.value)}
            placeholder="my-space or your-domain.com"
          />
        </Field>
        {spaceHandle && isCustomDomain(spaceHandle) && (
          <Text fontSize="xs" color="blue.300" mt={1}>
            This looks like a custom domain. You&apos;ll need to verify
            ownership.
          </Text>
        )}
        <Group mt={2}>
          <Button colorPalette="primary" type="submit" loading={handleLoading}>
            {spaceHandle && isCustomDomain(spaceHandle)
              ? 'Verify & Save Handle'
              : 'Save Handle'}
          </Button>
          {space.handle && (
            <Button
              variant="outline"
              colorPalette="red"
              type="button"
              onClick={async () => {
                await space.edit({ handle: null });
                setSpaceHandle('');
              }}
            >
              Release Handle
            </Button>
          )}
        </Group>
      </Form>

      <h2>Bots</h2>
      <Button
        variant="plain"
        type="button"
        onClick={() => {
          setModal({
            elem: <AddBotModal space={space} />,
          });
        }}
      >
        Add Bot
      </Button>

      <h2>Dangerous</h2>
      <Group>
        <Button colorPalette="danger">Delete Space</Button>
      </Group>
    </SettingSurface>
  );
}

function Switch({ nav, space }: { nav: string; space: MikotoSpace }) {
  switch (nav) {
    case 'overview':
      return <Overview space={space} />;
    case 'invites':
      return <Invites space={space} />;
    case 'roles':
      return <RolesSubsurface space={space} />;
    case 'emojis':
      return <EmojiSubsurface />;
    case 'bans':
      return <BansSubsurface />;
    default:
      return null;
  }
}

const SPACE_SETTING_CATEGORIES = [
  { code: 'overview', tkey: 'spaceSettings.overview.title' },
  { code: 'invites', tkey: 'spaceSettings.invites.title' },
  { code: 'roles', tkey: 'spaceSettings.roles.title' },
  { code: 'emojis', tkey: 'spaceSettings.emojis.title' },
  { code: 'bans', tkey: 'spaceSettings.bans.title' },
];

export function SpaceSettingsSurface({ spaceId }: { spaceId: string }) {
  const mikoto = useMikoto();
  const space = mikoto.spaces._get(spaceId)!;

  return (
    <BaseSettingsSurface
      defaultNav="overview"
      categories={SPACE_SETTING_CATEGORIES}
      switcher={(nav) => <Switch space={space} nav={nav} />}
    />
  );
}
