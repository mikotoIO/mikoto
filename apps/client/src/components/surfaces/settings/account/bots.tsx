import {
  Box,
  Code,
  Group,
  HStack,
  Input,
  Stack,
  Text,
  Textarea,
} from '@chakra-ui/react';
import styled from '@emotion/styled';
import { faCopy, faRobot } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { BotCreatedResponse } from '@mikoto-io/mikoto.js';
import { useSetAtom } from 'jotai';
import { useState } from 'react';
import { useAsync } from 'react-async-hook';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';

import { modalState } from '@/components/ContextMenu';
import { Avatar } from '@/components/atoms/Avatar';
import { Button, Field } from '@/components/ui';
import { DialogContent } from '@/components/ui';
import { useAuthClient } from '@/hooks';
import { useTabkit } from '@/store/surface';
import { Form } from '@/ui';
import { SettingSurface } from '@/views';

const BotCardContainer = styled.div`
  background-color: var(--chakra-colors-gray-800);
  display: flex;
  gap: 16px;
  margin: 16px 0 0;
  padding: 16px;
  width: 800px;
  max-width: 100%;
  box-sizing: border-box;
  cursor: pointer;
  transition: background-color 0.15s;
  &:hover {
    background-color: var(--chakra-colors-gray-700);
  }
`;

const StatusPill = styled.span<{ online?: boolean }>`
  display: inline-block;
  padding: 2px 8px;
  font-size: 12px;
  font-weight: 600;
  background-color: ${(p) =>
    p.online
      ? 'var(--chakra-colors-green-600)'
      : 'var(--chakra-colors-gray-600)'};
  color: white;
`;

interface BotProps {
  id: string;
  name: string;
  visibility: string;
  user?: { avatar?: string | null } | null;
}

function BotCard({ id, name, visibility, user }: BotProps) {
  const tabkit = useTabkit();
  return (
    <BotCardContainer
      onClick={() => {
        tabkit.openTab(
          {
            kind: 'botSettings',
            botId: id,
            key: id,
          },
          true,
        );
      }}
    >
      <Avatar src={user?.avatar ?? undefined} size={64} />
      <Box flex="1">
        <HStack gap={2} mb={1}>
          <Text fontWeight="bold" fontSize="lg">
            {name}
          </Text>
          <StatusPill>
            {visibility === 'PUBLIC' ? 'Public' : 'Private'}
          </StatusPill>
        </HStack>
        <Text fontSize="sm" color="gray.400">
          Bot ID: {id}
        </Text>
      </Box>
    </BotCardContainer>
  );
}

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
            toast.success('Token copied to clipboard!');
          }}
        >
          <FontAwesomeIcon icon={faCopy} /> Copy
        </Button>
      </HStack>
    </Stack>
  );
}

function BotCreateModal() {
  const authClient = useAuthClient();
  const { register, handleSubmit } = useForm();
  const setModal = useSetAtom(modalState);
  const [created, setCreated] = useState<BotCreatedResponse | null>(null);

  if (created) {
    return (
      <DialogContent rounded="md" p={4} maxW="520px">
        <Stack gap={3}>
          <HStack gap={2}>
            <Text fontSize="xl" fontWeight="bold" color="green.400">
              ✓ Bot Created
            </Text>
          </HStack>
          <Field label="Bot ID">
            <HStack>
              <Code flex="1" p={2} fontSize="sm">
                {created.id}
              </Code>
              <Button
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(created.id);
                  toast.success('Bot ID copied!');
                }}
              >
                <FontAwesomeIcon icon={faCopy} />
              </Button>
            </HStack>
          </Field>
          <Field label="Token">
            <TokenDisplay token={created.token} />
          </Field>
          <Button colorPalette="primary" onClick={() => setModal(null)}>
            Done
          </Button>
        </Stack>
      </DialogContent>
    );
  }

  return (
    <DialogContent rounded="md" p={4} maxW="480px">
      <Form
        onSubmit={handleSubmit(async (form) => {
          const res = await authClient.createBot({ name: form.name });
          setCreated(res);
        })}
      >
        <h1>Create Bot</h1>
        <Field label="Bot Name">
          <Input autoComplete="off" {...register('name', { required: true })} />
        </Field>
        <Field label="Description (optional)">
          <Textarea {...register('description')} />
        </Field>
        <Button colorPalette="primary" type="submit">
          Create Bot
        </Button>
      </Form>
    </DialogContent>
  );
}

export function BotsSurface() {
  const authClient = useAuthClient();
  const setModal = useSetAtom(modalState);
  const { t } = useTranslation();

  const { result: bots } = useAsync(() => authClient.listBots(), []);

  return (
    <SettingSurface>
      <h1>{t('accountSettings.bots.title')}</h1>
      <Text color="gray.400" mb={4}>
        Create and manage bots that can interact with your spaces via the Mikoto
        API.
      </Text>
      <Button
        colorPalette="primary"
        onClick={() => {
          setModal({
            elem: <BotCreateModal />,
          });
        }}
      >
        {t('accountSettings.bots.createBot')}
      </Button>

      {bots && bots.length === 0 && (
        <Box textAlign="center" py={12}>
          <FontAwesomeIcon icon={faRobot} size="3x" color="gray" />
          <Text mt={4} color="gray.400" fontSize="lg">
            No bots yet
          </Text>
          <Text color="gray.500" fontSize="sm">
            Create your first bot to get started with the Mikoto API.
          </Text>
        </Box>
      )}

      {bots &&
        bots.map((bot) => (
          <BotCard
            key={bot.id}
            id={bot.id}
            name={bot.name}
            visibility={bot.visibility}
            user={bot.user}
          />
        ))}
    </SettingSurface>
  );
}
