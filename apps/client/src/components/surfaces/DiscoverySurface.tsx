import { Heading } from '@chakra-ui/react';

import { TabName } from '@/components/TabBar';

import { ViewContainer } from '../ViewContainer';

export function DiscoverySurface() {
  return (
    <ViewContainer padded scroll>
      <TabName name="Discover Spaces" />
      <Heading>Find Your Space</Heading>
    </ViewContainer>
  );
}
