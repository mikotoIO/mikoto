import { Box, Flex } from '@chakra-ui/react';
import { useState } from 'react';

import { CloseButton } from '@/components/ui';

export interface AppError {
  name: string;
  message: string;
}

export function useErrorElement() {
  const [error, setError] = useState<AppError | null>(null);
  return {
    el: error && (
      <Flex bg="gray.800" p={2} color="white" rounded="md" position="relative">
        <Box w={2} bg="red.500" mr={2} rounded="md" />
        <Box p={2}>{error.message}</Box>
        <CloseButton
          onClick={() => {
            setError(null);
          }}
        />
      </Flex>
    ),
    error,
    setError,
  };
}
