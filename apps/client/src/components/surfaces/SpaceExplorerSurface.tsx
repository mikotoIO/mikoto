import { Heading } from '@chakra-ui/react';
import { faEarthAmerica } from '@fortawesome/free-solid-svg-icons';

import { Surface } from '../Surface';
import { TabName } from '../tabs';

export function SpaceExplorerSurface() {
  return (
    <Surface padded scroll>
      <TabName name="My Spaces" icon={faEarthAmerica} />
      <Heading size="2xl">My Spaces</Heading>
    </Surface>
  );
}
