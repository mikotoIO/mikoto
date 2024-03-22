import { Box, Flex } from '@chakra-ui/react';
import { faClose } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { AppError } from 'mikotojs';
import { useState } from 'react';

export function useErrorElement() {
  const [error, setError] = useState<AppError | null>(null);
  return {
    el: error && (
      <Flex bg="gray.800" p={2} color="white" rounded="md" position="relative">
        <Box w={2} bg="red.500" mr={2} rounded="md" />
        <Box p={2}>{error.message}</Box>
        <Box
          as="button"
          color="white"
          position="absolute"
          bg="transparent"
          type="button"
          fontSize="16px"
          top={2}
          right={1}
          border="none"
          onClick={() => {
            setError(null);
          }}
        >
          <FontAwesomeIcon icon={faClose} />
        </Box>
      </Flex>
    ),
    error,
    setError,
  };
}
