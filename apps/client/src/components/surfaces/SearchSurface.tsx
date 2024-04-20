import { Heading, Input } from '@chakra-ui/react';
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';

import { TabName } from '@/components/TabList';
import { ViewContainer } from '@/components/ViewContainer';
import { Form } from '@/ui';

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
