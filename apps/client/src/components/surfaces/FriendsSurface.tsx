import { Box, Button, Flex, Heading, Input } from '@chakra-ui/react';
import styled from '@emotion/styled';
import { faUserGroup } from '@fortawesome/free-solid-svg-icons';
import { MikotoRelationship } from '@mikoto-io/mikoto.js';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useSnapshot } from 'valtio/react';

import { Avatar } from '@/components/atoms/Avatar';
import { Surface } from '@/components/Surface';
import { TabName } from '@/components/tabs';
import { Field } from '@/components/ui';
import { useMikoto } from '@/hooks';
import { Form } from '@/ui';

const RelationItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border-radius: 8px;

  &:hover {
    background: var(--chakra-colors-gray-700);
  }
`;

export function FriendsSurface() {
  const form = useForm({
    defaultValues: {
      userId: '',
    },
  });
  const mikoto = useMikoto();

  useEffect(() => {
    mikoto.relationships.list();
  }, []);

  useSnapshot(mikoto.relationships.cache);

  const allRelations = mikoto.relationships.values();
  const friends = allRelations.filter(
    (r: MikotoRelationship) => r.state === 'FRIEND',
  );
  const incoming = allRelations.filter(
    (r: MikotoRelationship) => r.state === 'INCOMING_REQUEST',
  );
  const outgoing = allRelations.filter(
    (r: MikotoRelationship) => r.state === 'OUTGOING_REQUEST',
  );

  return (
    <Surface padded scroll>
      <TabName name="Friends" icon={faUserGroup} />
      <Heading mb={4}>Friends</Heading>

      <Form
        onSubmit={form.handleSubmit(async (data) => {
          await mikoto.relationships.request(data.userId);
          form.reset();
        })}
      >
        <Flex gap={2} align="end">
          <Field label="Send Friend Request (User ID)">
            <Input
              autoComplete="off"
              placeholder="User ID"
              {...form.register('userId')}
            />
          </Field>
          <Button type="submit" colorPalette="success" flexShrink={0}>
            Send Request
          </Button>
        </Flex>
      </Form>

      {incoming.length > 0 && (
        <Box mt={6}>
          <Heading as="h2" fontSize="lg" mb={2}>
            Incoming Requests ({incoming.length})
          </Heading>
          {incoming.map((rel: MikotoRelationship) => (
            <RelationItem key={rel.id}>
              <Avatar size={32} userId={rel.relationId} />
              <Box flex={1}>{rel.relationId}</Box>
              <Button
                size="sm"
                colorPalette="success"
                onClick={() => mikoto.relationships.accept(rel.relationId)}
              >
                Accept
              </Button>
              <Button
                size="sm"
                colorPalette="red"
                variant="outline"
                onClick={() => mikoto.relationships.remove(rel.relationId)}
              >
                Decline
              </Button>
            </RelationItem>
          ))}
        </Box>
      )}

      {outgoing.length > 0 && (
        <Box mt={6}>
          <Heading as="h2" fontSize="lg" mb={2}>
            Outgoing Requests ({outgoing.length})
          </Heading>
          {outgoing.map((rel: MikotoRelationship) => (
            <RelationItem key={rel.id}>
              <Avatar size={32} userId={rel.relationId} />
              <Box flex={1}>{rel.relationId}</Box>
              <Button
                size="sm"
                variant="outline"
                onClick={() => mikoto.relationships.remove(rel.relationId)}
              >
                Cancel
              </Button>
            </RelationItem>
          ))}
        </Box>
      )}

      <Box mt={6}>
        <Heading as="h2" fontSize="lg" mb={2}>
          Friends ({friends.length})
        </Heading>
        {friends.length === 0 && (
          <Box color="gray.500">No friends yet. Send a friend request above!</Box>
        )}
        {friends.map((rel: MikotoRelationship) => (
          <RelationItem key={rel.id}>
            <Avatar size={32} userId={rel.relationId} />
            <Box flex={1}>{rel.relationId}</Box>
            <Button
              size="sm"
              variant="outline"
              colorPalette="red"
              onClick={() => mikoto.relationships.remove(rel.relationId)}
            >
              Remove
            </Button>
          </RelationItem>
        ))}
      </Box>
    </Surface>
  );
}
