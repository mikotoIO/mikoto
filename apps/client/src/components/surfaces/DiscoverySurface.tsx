import { Heading } from '@chakra-ui/react';

import { ViewContainer } from '@/components/ViewContainer';
import { TabName } from '@/components/tabs';

export function DiscoverySurface() {
  return (
    <ViewContainer padded scroll>
      <TabName name="Discover Spaces" />
      <Heading>Find Your Space</Heading>
    </ViewContainer>
  );
}
