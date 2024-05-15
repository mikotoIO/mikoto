import { Heading } from '@chakra-ui/react';

import { Surface } from '@/components/Surface';
import { TabName } from '@/components/tabs';

export function DiscoverySurface() {
  return (
    <Surface padded scroll>
      <TabName name="Discover Spaces" />
      <Heading>Find Your Space</Heading>
    </Surface>
  );
}
