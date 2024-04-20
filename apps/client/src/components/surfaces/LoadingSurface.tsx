import { Box, Center, Heading, Spinner } from '@chakra-ui/react';

import { TabName } from '@/components/TabBar';
import { ViewContainer } from '@/components/ViewContainer';

export function LoadingSurface() {
  return (
    <ViewContainer padded>
      <TabName name="Loading..." />
      <Center h="100%">
        <Box>
          <Spinner size="xl" thickness="6px" color="blue.500" />
        </Box>
      </Center>
    </ViewContainer>
  );
}
