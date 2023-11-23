import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import { Form, Heading, Input } from '@mikoto-io/lucid';

import { TabName } from '../TabBar';
import { ViewContainer } from '../ViewContainer';

export function SearchSurface({ spaceId }: { spaceId: string }) {
  return (
    <ViewContainer padded scroll>
      <TabName name="Search" icon={faMagnifyingGlass} />
      <Heading>Search</Heading>
      <Form>
        <Input placeholder="Search" />
      </Form>
    </ViewContainer>
  );
}
