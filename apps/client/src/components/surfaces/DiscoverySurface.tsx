import { Heading } from '@chakra-ui/react';

import { TabName } from '@/components/TabList';
import { ViewContainer } from '@/components/ViewContainer';

export function DiscoverySurface() {
  return (
    <ViewContainer padded scroll>
      <TabName name="Discover Spaces" />
      <Heading>Find Your Space</Heading>
    </ViewContainer>
  );
}
