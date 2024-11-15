import { Button, Heading, Input } from '@chakra-ui/react';
import { faUserGroup } from '@fortawesome/free-solid-svg-icons';
import { useForm } from 'react-hook-form';

import { Surface } from '@/components/Surface';
import { TabName } from '@/components/tabs';
import { Field } from '@/components/ui';
import { useMikoto } from '@/hooks';
import { Form } from '@/ui';

export function FriendsSurface() {
  const form = useForm({
    defaultValues: {
      friendId: '',
    },
  });
  const mikoto = useMikoto();

  return (
    <Surface padded scroll>
      <TabName name="Friends" icon={faUserGroup} />
      <Heading>Friends</Heading>
      <Form
        onSubmit={form.handleSubmit(async (data) => {
          await mikoto.rest['relations.openDm'](undefined, {
            params: { relationId: data.friendId },
          });
        })}
      >
        <Field label="Friend ID">
          <Input placeholder="Friend ID" {...form.register('friendId')} />
        </Field>
        <Button type="submit" colorPalette="success">
          Send Friend Request (Debug)
        </Button>
        <Heading as="h2" fontSize="xl">
          Incoming Requests
        </Heading>
        <Heading as="h2" fontSize="xl">
          Outgoing Requests
        </Heading>
      </Form>
    </Surface>
  );
}
