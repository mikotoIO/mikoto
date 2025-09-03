import { Box, Center, Text } from '@chakra-ui/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { faMikoto } from '@/components/icons';

export function WelcomePanel() {
  return (
    <Center w="100%" h="100%" flexDir="column" className="empty-view">
      <FontAwesomeIcon icon={faMikoto} fontSize="10vw" />
      <Box fontSize="20px" mt="10px" mb="4px">
        Welcome to Mikoto
      </Box>
      <Text color="gray.400" fontSize="14px">
        Open a channel from the sidebar to get started
      </Text>
    </Center>
  );
}
