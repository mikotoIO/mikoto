import { faUserGroup } from '@fortawesome/free-solid-svg-icons';
import { Button, Input, Heading, Form } from '@mikoto-io/lucid';

import { TabName } from '../TabBar';
import { ViewContainer } from '../ViewContainer';

export function FriendsSurface() {
  return (
    <ViewContainer padded scroll>
      <TabName name="Friends" icon={faUserGroup} />
      <Heading>Friends</Heading>
      <Form>
        <Input placeholder="Friend Name" />
        <Button type="submit" variant="success">
          Search for Friend
        </Button>
        <Heading as="h2">Incoming Requests</Heading>
        <Heading as="h2">Outgoing Requests</Heading>
      </Form>
    </ViewContainer>
  );
}
