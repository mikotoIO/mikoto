import {
  Box,
  Button,
  Center,
  Code,
  Flex,
  Group,
  Heading,
} from '@chakra-ui/react';
import { faRefresh } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useState } from 'react';
import { FallbackProps } from 'react-error-boundary';

import { Surface } from '@/components/Surface';
import { TabName } from '@/components/tabs';

export function ErrorSurface({ error, resetErrorBoundary }: FallbackProps) {
  const [showDetails, setShowDetails] = useState(false);
  return (
    <Surface padded>
      <TabName name="Error" />
      <Flex direction="column" alignItems="center" gap={4}>
        <Heading m={0}>Error!</Heading>
        <Box>You were probably not supposed to see this.</Box>
        <Box>Please contact the devs, and they'll fix it soon!</Box>
        <Group>
          <Button size="sm" onClick={resetErrorBoundary} colorPalette="primary">
            <FontAwesomeIcon icon={faRefresh} />
            Reload
          </Button>
          <Button size="sm" onClick={() => setShowDetails(!showDetails)}>
            Show Error Details
          </Button>
        </Group>
        {showDetails && <Code variant="solid">{error.message}</Code>}
      </Flex>
    </Surface>
  );
}
