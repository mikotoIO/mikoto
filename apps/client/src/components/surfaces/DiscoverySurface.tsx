import { Box, Button, Flex, Grid, Heading, Text } from '@chakra-ui/react';
import { faUser } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { SpaceExt } from '@mikoto-io/mikoto.js';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Suspense, useState } from 'react';

import { Surface } from '@/components/Surface';
import { normalizeMediaUrl } from '@/components/atoms/Avatar';
import { StyledSpaceIcon } from '@/components/atoms/SpaceIcon';
import { TabName } from '@/components/tabs';
import { useMikoto } from '@/hooks';
import { Spinner } from '@/ui/Spinner';

function DiscoverCard({ space }: { space: SpaceExt }) {
  const mikoto = useMikoto();
  const [joining, setJoining] = useState(false);

  const joined = mikoto.spaces.cache.has(space.id);

  const join = async () => {
    if (!space.handle) return;
    setJoining(true);
    try {
      await mikoto.spaces.join(`@${space.handle}`);
    } finally {
      setJoining(false);
    }
  };

  return (
    <Flex
      direction="column"
      gap={4}
      p={5}
      rounded="lg"
      bg="gray.800"
      borderWidth="1px"
      borderColor="gray.700"
      transition="border-color 0.15s, transform 0.15s"
      _hover={{
        borderColor: 'gray.600',
        transform: 'translateY(-1px)',
      }}
    >
      <Flex gap={4} align="center" minW={0}>
        <StyledSpaceIcon
          size="56px"
          spaceId={space.id}
          icon={normalizeMediaUrl(space.icon)}
        >
          {space.icon === null ? space.name[0] : ''}
        </StyledSpaceIcon>
        <Box minW={0} flex={1}>
          <Text fontWeight={700} fontSize="md" color="gray.50" truncate>
            {space.name}
          </Text>
          <Flex align="center" gap={1.5} color="gray.400" fontSize="xs" mt={1}>
            <FontAwesomeIcon icon={faUser} />
            <Text as="span">{space.memberCount} members</Text>
          </Flex>
        </Box>
      </Flex>
      <Button
        colorPalette="primary"
        size="sm"
        loading={joining}
        disabled={joined || !space.handle}
        onClick={join}
      >
        {joined ? 'Joined' : 'Join Space'}
      </Button>
    </Flex>
  );
}

function DiscoverList() {
  const mikoto = useMikoto();
  const { data: spaces } = useSuspenseQuery({
    queryKey: ['spaces.discover'],
    queryFn: () => mikoto.spaces.discover(),
  });

  if (spaces.length === 0) {
    return (
      <Text color="gray.400" mt={4}>
        No public spaces to discover yet. Check back later!
      </Text>
    );
  }

  return (
    <Grid
      templateColumns="repeat(auto-fill, minmax(280px, 1fr))"
      gap={4}
      mt={6}
    >
      {spaces.map((space) => (
        <DiscoverCard key={space.id} space={space} />
      ))}
    </Grid>
  );
}

export function DiscoverySurface() {
  return (
    <Surface padded scroll>
      <TabName name="Discover Spaces" />
      <Heading size="2xl" m={0}>
        Find Your Space
      </Heading>
      <Text color="gray.400" mt={2}>
        Browse public communities and join the ones that catch your eye.
      </Text>
      <Suspense
        fallback={
          <Flex justify="center" mt={12}>
            <Spinner />
          </Flex>
        }
      >
        <DiscoverList />
      </Suspense>
    </Surface>
  );
}
