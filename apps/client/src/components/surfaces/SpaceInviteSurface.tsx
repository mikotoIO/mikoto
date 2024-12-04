import { Box, Button, Flex, Heading } from '@chakra-ui/react';
import { faUser } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { SponsoredFeature } from '../Sponsor';
import { Surface } from '../Surface';

export function SpaceInviteSurface({ inviteCode }: { inviteCode: string }) {
  return (
    <Surface>
      <Box>
        <Flex
          h="200px"
          bg="url('/images/artworks/2.jpg') no-repeat center center"
          bgSize="cover"
        />
        <Flex p={8} direction="column" gap={8}>
          <Heading fontSize="lg" m={0} color="gray.400">
            You got a new space invite!
          </Heading>
          <Heading m={0}>Space Name</Heading>
          <Box color="gray.400" fontSize="sm">
            <Box as="span" mr={2}>
              <FontAwesomeIcon icon={faUser} />
            </Box>
            12345 Members
          </Box>
          <Flex direction="column" gap={2} maxW="400px">
            <Button colorPalette="primary">Join Space Name</Button>
            <Button size="sm" colorPalette="primary" variant="ghost">
              No, Thanks
            </Button>
          </Flex>
          <SponsoredFeature />
        </Flex>
      </Box>
    </Surface>
  );
}
