import {
  Badge,
  Box,
  Button,
  Flex,
  Group,
  Heading,
  Input,
  Text,
} from '@chakra-ui/react';
import styled from '@emotion/styled';
import {
  faCheck,
  faEnvelope,
  faUserGroup,
  faUserSlash,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { MikotoRelationship } from '@mikoto-io/mikoto.js';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useSnapshot } from 'valtio/react';

import { Surface } from '@/components/Surface';
import { TabName } from '@/components/tabs';
import { Field } from '@/components/ui';
import { toaster } from '@/components/ui/toaster';
import { useMikoto } from '@/hooks';
import { useTabkit } from '@/store/surface';
import { Form } from '@/ui';

import { Avatar } from '../atoms/Avatar';

type FriendsTab = 'all' | 'pending' | 'blocked';

const TabButton = styled.button<{ active?: boolean }>`
  padding: 6px 16px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  background: ${(p) =>
    p.active ? 'var(--chakra-colors-gray-600)' : 'transparent'};
  color: ${(p) =>
    p.active
      ? 'var(--chakra-colors-gray-100)'
      : 'var(--chakra-colors-gray-400)'};

  &:hover {
    background: var(--chakra-colors-gray-700);
    color: var(--chakra-colors-gray-200);
  }
`;

const FriendRow = styled.div`
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border-radius: 8px;
  gap: 12px;

  &:hover {
    background: var(--chakra-colors-gray-750);
  }
`;

function FriendItem({
  relation,
  onMessage,
}: {
  relation: MikotoRelationship;
  onMessage: () => void;
}) {
  return (
    <FriendRow>
      <Avatar
        src={relation.user.avatar ?? undefined}
        userId={relation.user.id}
        size={40}
      />
      <Box flex={1}>
        <Text fontWeight="600" fontSize="sm">
          {relation.user.name}
        </Text>
        {relation.user.handle && (
          <Text fontSize="xs" color="gray.500">
            @{relation.user.handle}
          </Text>
        )}
      </Box>
      <Group>
        <Button size="sm" colorPalette="secondary" onClick={onMessage}>
          <FontAwesomeIcon icon={faEnvelope} />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          colorPalette="red"
          onClick={() => relation.remove()}
        >
          <FontAwesomeIcon icon={faUserSlash} />
        </Button>
      </Group>
    </FriendRow>
  );
}

function PendingItem({ relation }: { relation: MikotoRelationship }) {
  const isIncoming = relation.state === 'INCOMING_REQUEST';

  return (
    <FriendRow>
      <Avatar
        src={relation.user.avatar ?? undefined}
        userId={relation.user.id}
        size={40}
      />
      <Box flex={1}>
        <Text fontWeight="600" fontSize="sm">
          {relation.user.name}
        </Text>
        <Text fontSize="xs" color="gray.500">
          {isIncoming ? 'Incoming request' : 'Outgoing request'}
        </Text>
      </Box>
      <Group>
        {isIncoming ? (
          <>
            <Button
              size="sm"
              colorPalette="success"
              onClick={() => relation.accept()}
            >
              <FontAwesomeIcon icon={faCheck} />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              colorPalette="red"
              onClick={() => relation.decline()}
            >
              <FontAwesomeIcon icon={faXmark} />
            </Button>
          </>
        ) : (
          <Button
            size="sm"
            variant="ghost"
            colorPalette="red"
            onClick={() => relation.remove()}
          >
            Cancel
          </Button>
        )}
      </Group>
    </FriendRow>
  );
}

function BlockedItem({ relation }: { relation: MikotoRelationship }) {
  return (
    <FriendRow>
      <Avatar
        src={relation.user.avatar ?? undefined}
        userId={relation.user.id}
        size={40}
      />
      <Box flex={1}>
        <Text fontWeight="600" fontSize="sm">
          {relation.user.name}
        </Text>
      </Box>
      <Button
        size="sm"
        variant="ghost"
        colorPalette="red"
        onClick={() => relation.unblock()}
      >
        Unblock
      </Button>
    </FriendRow>
  );
}

export function FriendsSurface() {
  const [activeTab, setActiveTab] = useState<FriendsTab>('all');
  const mikoto = useMikoto();
  const tabkit = useTabkit();

  const form = useForm({
    defaultValues: { userId: '' },
  });

  useSnapshot(mikoto.relationships.cache);

  const friends = mikoto.relationships.friends;
  const pending = mikoto.relationships.pending;
  const blocked = mikoto.relationships.blocked;

  const handleOpenDm = async (relation: MikotoRelationship) => {
    const channel = await relation.openDm();
    tabkit.openTab(
      {
        kind: 'textChannel',
        key: channel.id,
        channelId: channel.id,
      },
      false,
    );
  };

  return (
    <Surface padded scroll>
      <TabName name="Friends" icon={faUserGroup} />
      <Flex align="center" gap={4} mb={4}>
        <Heading fontSize="xl" mb={0}>Friends</Heading>
        <Flex gap={1}>
          <TabButton
            active={activeTab === 'all'}
            onClick={() => setActiveTab('all')}
          >
            All
            {friends.length > 0 && (
              <Badge ml={1} colorPalette="gray" variant="solid" size="sm">
                {friends.length}
              </Badge>
            )}
          </TabButton>
          <TabButton
            active={activeTab === 'pending'}
            onClick={() => setActiveTab('pending')}
          >
            Pending
            {pending.length > 0 && (
              <Badge ml={1} colorPalette="yellow" variant="solid" size="sm">
                {pending.length}
              </Badge>
            )}
          </TabButton>
          <TabButton
            active={activeTab === 'blocked'}
            onClick={() => setActiveTab('blocked')}
          >
            Blocked
          </TabButton>
        </Flex>
      </Flex>

      <Box mb={6}>
        <Form
          onSubmit={form.handleSubmit(async (data) => {
            try {
              await mikoto.relationships.sendRequest(data.userId.trim());
              form.reset();
              toaster.success({
                title: 'Friend request sent!',
              });
            } catch {
              toaster.error({
                title: 'Failed to send friend request',
              });
            }
          })}
        >
          <Flex gap={2} align="end">
            <Field label="Add Friend" flex={1}>
              <Input
                autoComplete="off"
                placeholder="Enter user ID"
                {...form.register('userId')}
              />
            </Field>
            <Button type="submit" colorPalette="success">
              Send Request
            </Button>
          </Flex>
        </Form>
      </Box>

      {activeTab === 'all' && (
        <Box>
          {friends.length === 0 ? (
            <Text color="gray.500" p={4}>
              No friends yet. Send a friend request to get started!
            </Text>
          ) : (
            friends.map((rel) => (
              <FriendItem
                key={rel.id}
                relation={rel}
                onMessage={() => handleOpenDm(rel)}
              />
            ))
          )}
        </Box>
      )}

      {activeTab === 'pending' && (
        <Box>
          {pending.length === 0 ? (
            <Text color="gray.500" p={4}>
              No pending requests.
            </Text>
          ) : (
            pending.map((rel) => <PendingItem key={rel.id} relation={rel} />)
          )}
        </Box>
      )}

      {activeTab === 'blocked' && (
        <Box>
          {blocked.length === 0 ? (
            <Text color="gray.500" p={4}>
              No blocked users.
            </Text>
          ) : (
            blocked.map((rel) => <BlockedItem key={rel.id} relation={rel} />)
          )}
        </Box>
      )}
    </Surface>
  );
}
