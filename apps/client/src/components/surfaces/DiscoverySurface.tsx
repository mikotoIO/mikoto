import { Heading } from '@mikoto-io/lucid';

import { TabName } from '../TabBar';
import { ViewContainer } from '../ViewContainer';

export function DiscoverySurface() {
  return (
    <ViewContainer padded scroll>
      <TabName name="Discover Spaces" />
      <Heading>Find Your Space</Heading>
    </ViewContainer>
  );
}
