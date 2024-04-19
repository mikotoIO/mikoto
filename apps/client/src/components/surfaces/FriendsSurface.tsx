import {
  Button,
  FormControl,
  FormLabel,
  Heading,
  Input,
} from '@chakra-ui/react';
import { faUserGroup } from '@fortawesome/free-solid-svg-icons';
import { useForm } from 'react-hook-form';

import { TabName } from '@/components/TabBar';
import { ViewContainer } from '@/components/ViewContainer';
import { Form } from '@/components/atoms';
import { useMikoto } from '@/hooks';

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
        <FormControl>
          <FormLabel>Friend ID</FormLabel>
          <Input placeholder="Friend ID" {...form.register('friendId')} />
        </FormControl>
        <Button type="submit" variant="success">
          Send Friend Request (Debug)
        </Button>
        <Heading as="h2" fontSize="xl">
          Incoming Requests
        </Heading>
        <Heading as="h2" fontSize="xl">
          Outgoing Requests
        </Heading>
      </Form>
    </ViewContainer>
  );
}
