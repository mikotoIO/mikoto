import { Box, Center, Heading } from '@chakra-ui/react';

import { TabName } from '@/components/TabList';
import { ViewContainer } from '@/components/ViewContainer';

export function ErrorSurface() {
  return (
    <ViewContainer padded>
      <TabName name="Error" />
      <Center>
        <Box>
          <Heading textAlign="center">Error!</Heading>
          <Box>You were probably not supposed to see this.</Box>
          <Box>Contact Cactus for additional details.</Box>
        </Box>
      </Center>
    </ViewContainer>
  );
}
