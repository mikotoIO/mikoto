import { faClose } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Box, Flex } from '@mikoto-io/lucid';
import { AppError } from 'mikotojs';
import { useState } from 'react';

export function useErrorElement() {
  const [error, setError] = useState<AppError | null>(null);
  return {
    el: error && (
      <Flex bg="N1000" p={8} txt="N0" rounded={4} position="relative">
        <Box w={8} bg="R700" m={{ right: 8 }} rounded={4} />
        <Box p={8}>{error.message}</Box>
        <Box
          as="button"
          txt="N0"
          position="absolute"
          bg="transparent"
          type="button"
          fs={16}
          style={{
            top: 8,
            right: 4,
            border: 'none',
          }}
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
