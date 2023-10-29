import { Heading, Image, Box, Flex } from '@mikoto-io/lucid';

import { TabName } from '../TabBar';
import { ViewContainer } from '../ViewContainer';

function LinkButton() {
  return (
    <Box bg="N800" p={16} rounded={4}>
      Join Town Hall
    </Box>
  );
}

export function WelcomeSurface() {
  return (
    <ViewContainer padded>
      <Box p={32}>
        <Flex center dir="column" gap={16}>
          <TabName name="Welcome to Mikoto" />
          <Image src="/logo/logo-mono.svg" w={100} />
          <Heading fs={40} m={0}>
            Welcome to Mikoto!
          </Heading>
          <Heading as="h2" m={0} fs={20} txt="N400">
            The most overkill messaging app in the world.
          </Heading>
          <LinkButton />
        </Flex>
      </Box>
    </ViewContainer>
  );
}
