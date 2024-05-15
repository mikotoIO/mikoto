import { Box, Button } from '@chakra-ui/react';

import { SettingSurface } from '@/views';

export function EmojiSubsurface() {
  return (
    <SettingSurface>
      <Box>
        <Button colorScheme="blue">Add Emoji</Button>
      </Box>
      <Box>emoji surface goes here</Box>
    </SettingSurface>
  );
}
