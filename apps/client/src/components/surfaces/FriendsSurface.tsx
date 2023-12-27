import { faUserGroup } from '@fortawesome/free-solid-svg-icons';
import { Button, Form, Heading, Input } from '@mikoto-io/lucid';
import { useForm } from 'react-hook-form';

import { useMikoto } from '../../hooks';
import { TabName } from '../TabBar';
import { ViewContainer } from '../ViewContainer';

export function FriendsSurface() {
  const form = useForm({
    defaultValues: {
      friendId: '',
    },
  });
  const mikoto = useMikoto();

  return (
    <ViewContainer padded scroll>
      <TabName name="Friends" icon={faUserGroup} />
      <Heading>Friends</Heading>
      <Form
        onSubmit={form.handleSubmit(async (data) => {
          await mikoto.client.relations.openDm({
            relationId: data.friendId,
          });
        })}
      >
        <Input
          labelName="Friend ID"
          placeholder="Friend ID"
          {...form.register('friendId')}
        />
        <Button type="submit" variant="success">
          Send Friend Request (Debug)
        </Button>
        <Heading as="h2">Incoming Requests</Heading>
        <Heading as="h2">Outgoing Requests</Heading>
      </Form>
    </ViewContainer>
  );
}
