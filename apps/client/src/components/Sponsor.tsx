import { Box, Flex, Heading } from '@chakra-ui/react';
import { faDonate } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export function SponsoredFeature() {
  return (
    <Flex
      as="a"
      color="white"
      textDecor="none"
      href="#"
      p={4}
      bg="gray.800"
      _hover={{
        bg: 'gray.750',
      }}
      rounded="lg"
      fontSize="sm"
      align="center"
      w="fit-content"
      gap={6}
    >
      <Box fontSize="32px" color="yellow.400">
        <FontAwesomeIcon icon={faDonate} />
      </Box>
      <Box>
        <Heading fontSize="md" color="gray.400">
          SPONSORED FEATURE
        </Heading>
        <Box>
          Want <strong>Improved Onboarding</strong> in Mikoto now?
        </Box>
        <Box>
          Sponsor this feature for yourself and everyone else for as low as{' '}
          <strong>$10</strong>!
        </Box>
      </Box>
    </Flex>
  );
}
