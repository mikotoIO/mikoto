import { faUserGroup } from '@fortawesome/free-solid-svg-icons';
import { Button, Heading } from '@mikoto-io/lucid';

import { TabName } from '../TabBar';
import { ViewContainer } from '../ViewContainer';

export function FriendsSurface() {
  return (
    <ViewContainer padded scroll>
      <TabName name="Friends" icon={faUserGroup} />
      <Heading>Friends</Heading>
      <Button variant="success">Add Friend</Button>
    </ViewContainer>
  );
}
