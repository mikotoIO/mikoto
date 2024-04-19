import { Box, Button } from '@chakra-ui/react';

import { SettingsView } from '@/views/SettingsViewTemplate';

export function EmojiSubsurface() {
  return (
    <SettingsView>
      <Box>
        <Button colorScheme="blue">Add Emoji</Button>
      </Box>
      <Box>emoji surface goes here</Box>
    </SettingsView>
  );
}
