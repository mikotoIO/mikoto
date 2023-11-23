import { faUserGroup } from '@fortawesome/free-solid-svg-icons';
import { Button, Form, Heading, Input } from '@mikoto-io/lucid';

import { TabName } from '../TabBar';
import { ViewContainer } from '../ViewContainer';

export function FriendsSurface() {
  return (
    <ViewContainer padded scroll>
      <TabName name="Friends" icon={faUserGroup} />
      <Heading>Friends</Heading>
      <Form>
        <Input placeholder="Friend ID" />
        <Button type="submit" variant="success">
          Send Friend Request
        </Button>
        <Heading as="h2">Incoming Requests</Heading>
        <Heading as="h2">Outgoing Requests</Heading>
      </Form>
    </ViewContainer>
  );
}
