import { Heading, Input } from '@chakra-ui/react';
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import { Form } from '@mikoto-io/lucid';

import { TabName } from '../TabBar';
import { ViewContainer } from '../ViewContainer';

export function SearchSurface({ spaceId }: { spaceId: string }) {
  return (
    <ViewContainer padded scroll>
      <TabName name="Search" icon={faMagnifyingGlass} />
      <Heading size="2xl">Search</Heading>
      <Form>
        <Input placeholder="Search" />
      </Form>
    </ViewContainer>
  );
}
