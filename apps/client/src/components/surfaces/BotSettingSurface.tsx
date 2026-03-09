import {
  Box,
  Checkbox,
  Code,
  Group,
  HStack,
  Input,
  NativeSelect,
  Stack,
  Text,
  Textarea,
} from '@chakra-ui/react';
import styled from '@emotion/styled';
import { faCopy, faPlus, faRobot, faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { BotInfo, BotSpaceInfo } from '@mikoto-io/mikoto.js';
import { useSetAtom } from 'jotai';
import { useState } from 'react';
import { useSnapshot } from 'valtio/react';
import { useAsync } from 'react-async-hook';
import { useForm } from 'react-hook-form';

import { modalState } from '@/components/ContextMenu';
import { Surface } from '@/components/Surface';
import { Avatar } from '@/components/atoms/Avatar';
import { AvatarEditor } from '@/components/molecules/AvatarEditor';
import { TabName } from '@/components/tabs';
import { Button, DialogContent, Field } from '@/components/ui';
import { toaster } from '@/components/ui/toaster';
import { uploadFile } from '@/functions/fileUpload';
import { useAuthClient, useMikoto } from '@/hooks';
import { useTabkit } from '@/store/surface';
import { Form } from '@/ui';

const Section = styled.div`
  margin-bottom: 32px;
  max-width: 640px;
`;

const DangerZone = styled.div`
  margin-top: 16px;
  max-width: 640px;
`;

const SpaceRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px solid var(--chakra-colors-gray-700);
`;

function TokenDisplay({ token }: { token: string }) {
  const [visible, setVisible] = useState(false);
  return (
    <Stack gap={2}>
      <Box bg="yellow.900" p={3} borderWidth="1px" borderColor="yellow.600">
        <Text fontWeight="bold" color="yellow.200" fontSize="sm">
          This token will only be shown once. Store it securely.
        </Text>
      </Box>
      <HStack>
        <Code flex="1" p={2} fontSize="sm" fontFamily="mono" overflow="hidden">
          {visible ? token : '•'.repeat(32)}
        </Code>
        <Button size="sm" onClick={() => setVisible(!visible)}>
          {visible ? 'Hide' : 'Show'}
        </Button>
        <Button
          size="sm"
          onClick={() => {
            navigator.clipboard.writeText(token);
            toaster.success({ title: 'Token copied to clipboard!' });
          }}
        >
          <FontAwesomeIcon icon={faCopy} /> Copy
        </Button>
      </HStack>
    </Stack>
  );
}

function DeleteBotModal({
  bot,
  onDeleted,
}: {
  bot: BotInfo;
  onDeleted: () => void;
}) {
  const authClient = useAuthClient();
  const setModal = useSetAtom(modalState);
  const { register, handleSubmit, watch } = useForm();
  const confirmName = watch('confirmName', '');

  return (
    <DialogContent rounded="md" p={4} maxW="480px">
      <Form
        onSubmit={handleSubmit(async () => {
          await authClient.deleteBot(bot.id);
          toaster.success({ title: 'Bot deleted' });
          setModal(null);
          onDeleted();
        })}
      >
        <Text fontWeight="bold" fontSize="lg" color="red.400">
          Delete Bot
        </Text>
        <Text color="gray.400" fontSize="sm">
          This action is irreversible. Type <strong>{bot.name}</strong> to
          confirm.
        </Text>
        <Input
          autoComplete="off"
          placeholder={bot.name}
          {...register('confirmName')}
        />
        <Button
          colorPalette="danger"
          type="submit"
          disabled={confirmName !== bot.name}
        >
          Delete Bot
        </Button>
      </Form>
    </DialogContent>
  );
}

function GeneralSection({
  bot,
  onUpdate,
}: {
  bot: BotInfo;
  onUpdate: () => void;
}) {
  const authClient = useAuthClient();
  const [name, setName] = useState(bot.user?.name ?? bot.name);
  const [description, setDescription] = useState(bot.user?.description ?? '');

  return (
    <Section>
      <h2>General</h2>
      <AvatarEditor
        avatar={bot.user?.avatar ?? undefined}
        onDrop={async (file) => {
          const { data } = await uploadFile('/avatar', file);
          await authClient.updateBot(bot.id, { avatar: data.url });
          onUpdate();
        }}
      />
      <Form mt={3}>
        <Field label="Bot Name">
          <Input
            autoComplete="off"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Field>
        <Field label="Description">
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Field>
        <Field label="Bot ID">
          <HStack>
            <Code flex="1" p={2} fontSize="sm">
              {bot.id}
            </Code>
            <Button
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(bot.id);
                toaster.success({ title: 'Copied bot ID' });
              }}
            >
              <FontAwesomeIcon icon={faCopy} />
            </Button>
          </HStack>
        </Field>
        <Button
          colorPalette="primary"
          type="button"
          onClick={async () => {
            await authClient.updateBot(bot.id, { name, description });
            toaster.success({ title: 'Bot updated' });
            onUpdate();
          }}
        >
          Save Changes
        </Button>
      </Form>
    </Section>
  );
}

function AuthSection({ bot }: { bot: BotInfo }) {
  const authClient = useAuthClient();
  const [newToken, setNewToken] = useState<string | null>(null);

  const tokenStatus = bot.lastTokenRegeneratedAt
    ? `Last regenerated ${new Date(bot.lastTokenRegeneratedAt).toLocaleDateString()}`
    : 'Never regenerated';

  return (
    <Section>
      <h2>Authentication</h2>
      <Text color="gray.400" fontSize="sm" mb={2}>
        {tokenStatus}
      </Text>
      {newToken ? (
        <TokenDisplay token={newToken} />
      ) : (
        <Button
          colorPalette="primary"
          onClick={async () => {
            if (
              !window.confirm(
                'Regenerate token? The old token will stop working.',
              )
            )
              return;
            const res = await authClient.regenerateBotToken(bot.id);
            setNewToken(res.token);
          }}
        >
          Regenerate Token
        </Button>
      )}
      {bot.visibility === 'PUBLIC' && bot.user?.handle && (
        <Box mt={4}>
          <Text fontWeight="bold" fontSize="sm" mb={1}>
            Bot Handle
          </Text>
          <HStack>
            <Code flex="1" p={2} fontSize="sm">
              {bot.user.handle}
            </Code>
            <Button
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(bot.user!.handle!);
                toaster.success({ title: 'Copied handle' });
              }}
            >
              <FontAwesomeIcon icon={faCopy} />
            </Button>
          </HStack>
          <Text color="gray.500" fontSize="xs" mt={1}>
            Public bots can be found and installed by their handle.
          </Text>
        </Box>
      )}
    </Section>
  );
}

const PERMISSION_SCOPES = [
  { key: 'read_messages', label: 'Read Messages' },
  { key: 'send_messages', label: 'Send Messages' },
  { key: 'manage_channels', label: 'Manage Channels' },
  { key: 'manage_members', label: 'Manage Members' },
  { key: 'voice', label: 'Voice' },
];

function PermissionsSection({
  bot,
  onUpdate,
}: {
  bot: BotInfo;
  onUpdate: () => void;
}) {
  const authClient = useAuthClient();
  const [visibility, setVisibility] = useState(bot.visibility);
  const [perms, setPerms] = useState<Set<string>>(
    new Set(bot.permissions ?? []),
  );

  const togglePerm = (key: string) => {
    setPerms((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <Section>
      <h2>Permissions & Visibility</h2>
      <Form mt={2}>
        <Field label="Visibility">
          <Group>
            <Button
              variant={visibility === 'PRIVATE' ? 'solid' : 'outline'}
              onClick={() => setVisibility('PRIVATE')}
              size="sm"
            >
              Private
            </Button>
            <Button
              variant={visibility === 'PUBLIC' ? 'solid' : 'outline'}
              onClick={() => setVisibility('PUBLIC')}
              size="sm"
            >
              Public
            </Button>
          </Group>
        </Field>
        <Text fontWeight="bold" fontSize="sm" mt={2}>
          Permission Scopes
        </Text>
        {PERMISSION_SCOPES.map((scope) => (
          <Checkbox.Root
            key={scope.key}
            checked={perms.has(scope.key)}
            onCheckedChange={() => togglePerm(scope.key)}
          >
            <Checkbox.HiddenInput />
            <Checkbox.Control />
            <Checkbox.Label fontSize="sm">{scope.label}</Checkbox.Label>
          </Checkbox.Root>
        ))}
        <Button
          colorPalette="primary"
          type="button"
          mt={2}
          onClick={async () => {
            await authClient.updateBot(bot.id, {
              visibility,
              permissions: [...perms],
            });
            toaster.success({ title: 'Permissions updated' });
            onUpdate();
          }}
        >
          Save
        </Button>
      </Form>
    </Section>
  );
}

function SpacesSection({ bot }: { bot: BotInfo }) {
  const authClient = useAuthClient();
  const mikoto = useMikoto();
  useSnapshot(mikoto.spaces);

  const { result: spaces, execute: refresh } = useAsync(
    () => authClient.listBotSpaces(bot.id),
    [bot.id],
  );

  const [selectedSpaceId, setSelectedSpaceId] = useState('');

  const installedSpaceIds = new Set(spaces?.map((s) => s.spaceId) ?? []);
  const availableSpaces = Array.from(mikoto.spaces.cache.values()).filter(
    (s) => !installedSpaceIds.has(s.id),
  );

  return (
    <Section>
      <h2>Spaces</h2>
      {spaces && spaces.length === 0 && (
        <Text color="gray.500" fontSize="sm">
          Not in any spaces
        </Text>
      )}
      {spaces?.map((s: BotSpaceInfo) => (
        <SpaceRow key={s.spaceId}>
          <Avatar src={s.spaceIcon ?? undefined} size={32} />
          <Text flex="1">{s.spaceName}</Text>
          <Button
            size="sm"
            colorPalette="danger"
            onClick={async () => {
              await authClient.removeBotFromSpace(bot.id, s.spaceId);
              toaster.success({ title: 'Bot removed from space' });
              refresh();
            }}
          >
            <FontAwesomeIcon icon={faTrash} /> Remove
          </Button>
        </SpaceRow>
      ))}
      {availableSpaces.length > 0 && (
        <HStack mt={3}>
          <NativeSelect.Root size="sm" flex="1">
            <NativeSelect.Field
              value={selectedSpaceId}
              onChange={(e) => setSelectedSpaceId(e.target.value)}
            >
              <option value="">Select a space...</option>
              {availableSpaces.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </NativeSelect.Field>
            <NativeSelect.Indicator />
          </NativeSelect.Root>
          <Button
            size="sm"
            colorPalette="primary"
            disabled={!selectedSpaceId}
            onClick={async () => {
              await authClient.installBot(bot.id, { spaceId: selectedSpaceId });
              toaster.success({ title: 'Bot added to space' });
              setSelectedSpaceId('');
              refresh();
            }}
          >
            <FontAwesomeIcon icon={faPlus} /> Add
          </Button>
        </HStack>
      )}
    </Section>
  );
}

export function BotSettingSurface({ botId }: { botId: string }) {
  const authClient = useAuthClient();
  const tabkit = useTabkit();

  const { result: bot, execute: refresh } = useAsync(
    () => authClient.getBot(botId),
    [botId],
  );
  const setModal = useSetAtom(modalState);

  if (!bot) {
    return (
      <Surface padded scroll>
        <TabName icon={faRobot} name="Manage Bot" />
        <Text>Loading...</Text>
      </Surface>
    );
  }

  return (
    <Surface padded scroll>
      <TabName icon={faRobot} name={`Manage ${bot.name}`} />
      <h1>Manage {bot.name}</h1>

      <GeneralSection bot={bot} onUpdate={refresh} />
      <AuthSection bot={bot} />
      <PermissionsSection bot={bot} onUpdate={refresh} />
      <SpacesSection bot={bot} />

      <DangerZone>
        <Text fontWeight="bold" color="red.400" mb={2}>
          Danger Zone
        </Text>
        <Button
          colorPalette="danger"
          onClick={() => {
            setModal({
              elem: (
                <DeleteBotModal
                  bot={bot}
                  onDeleted={() => {
                    tabkit.removeTab(botId);
                  }}
                />
              ),
            });
          }}
        >
          <FontAwesomeIcon icon={faTrash} /> Delete Bot
        </Button>
      </DangerZone>
    </Surface>
  );
}
