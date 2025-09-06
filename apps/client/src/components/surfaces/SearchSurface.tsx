import { Heading, Input } from '@chakra-ui/react';
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';

import { Surface } from '@/components/Surface';
import { TabName } from '@/components/tabs';
import { Form } from '@/ui';

export function SearchSurface({ spaceId: _spaceId }: { spaceId: string }) {
  return (
    <Surface padded scroll>
      <TabName name="Search" icon={faMagnifyingGlass} />
      <Heading size="2xl">Search</Heading>
      <Form>
        <Input placeholder="Search" />
      </Form>
    </Surface>
  );
}
