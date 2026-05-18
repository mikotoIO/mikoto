import { Badge, Box, Button, Flex, Heading, Text } from '@chakra-ui/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useCallback, useState } from 'react';

import { faMikoto } from '@/components/icons';
import { SpaceJoinModal } from '@/components/modals/SpaceJoin';
import { useMikoto } from '@/hooks';
import { useModalKit } from '@/store';
import { Tabable, useTabkit } from '@/store/surface';

type FeaturedCommunity = {
  id: string;
  initial: string;
  name: string;
  members: string;
  tagline: string;
  bg: string;
  fg: string;
};

const POPULAR: FeaturedCommunity[] = [
  {
    id: 'anime',
    initial: 'A',
    name: 'Anime & Manga',
    members: '12.4k members',
    tagline: 'Seasonal discussion, recs, art',
    bg: 'magenta.500',
    fg: 'white',
  },
  {
    id: 'indie',
    initial: 'I',
    name: 'Indie Game Dev',
    members: '3.1k members',
    tagline: 'Devlogs, playtesting, feedback',
    bg: 'cyan.500',
    fg: 'gray.900',
  },
  {
    id: 'music',
    initial: 'M',
    name: 'Music Production',
    members: '8.7k members',
    tagline: 'DAWs, samples, track reviews',
    bg: 'purple.500',
    fg: 'white',
  },
  {
    id: 'rust',
    initial: 'R',
    name: 'Rust Nerds',
    members: '5.9k members',
    tagline: 'The good kind of rust',
    bg: 'yellow.500',
    fg: 'gray.900',
  },
  {
    id: 'fediverse',
    initial: 'F',
    name: 'Fediverse Café',
    members: '2.3k members',
    tagline: 'ActivityPub & friends',
    bg: '#34D399',
    fg: 'gray.900',
  },
  {
    id: 'study',
    initial: 'S',
    name: 'Study Together',
    members: '6.0k members',
    tagline: 'Pomodoro rooms & notes',
    bg: 'blue.400',
    fg: 'white',
  },
];

function CommunityBadge({
  initial,
  bg,
  fg,
  size = 40,
}: {
  initial: string;
  bg: string;
  fg: string;
  size?: number;
}) {
  return (
    <Flex
      align="center"
      justify="center"
      flexShrink={0}
      w={`${size}px`}
      h={`${size}px`}
      rounded="md"
      bg={bg}
      color={fg}
      fontFamily="heading"
      fontWeight={700}
      fontSize={`${size * 0.5}px`}
      lineHeight={1}
    >
      {initial}
    </Flex>
  );
}

function CommunityCard({ community }: { community: FeaturedCommunity }) {
  return (
    <Flex
      direction="column"
      gap={3}
      p={4}
      rounded="lg"
      bg="gray.800"
      borderWidth="1px"
      borderColor="gray.700"
      cursor="pointer"
      transition="background-color 0.15s, border-color 0.15s, transform 0.15s"
      _hover={{
        bg: 'gray.750',
        borderColor: 'gray.600',
        transform: 'translateY(-1px)',
      }}
    >
      <Flex gap={3} align="center">
        <CommunityBadge
          initial={community.initial}
          bg={community.bg}
          fg={community.fg}
        />
        <Box minW={0}>
          <Text
            fontWeight={600}
            fontSize="sm"
            color="gray.50"
            truncate
            lineHeight={1.2}
          >
            {community.name}
          </Text>
          <Text fontSize="xs" color="gray.400" mt={0.5}>
            {community.members}
          </Text>
        </Box>
      </Flex>
      <Text fontSize="xs" color="gray.400" lineHeight={1.4}>
        {community.tagline}
      </Text>
    </Flex>
  );
}

export function WelcomePanel() {
  const tabkit = useTabkit();
  const mikoto = useMikoto();
  const modal = useModalKit();
  const [dragOver, setDragOver] = useState(false);

  const greetingName = mikoto.user.me?.name ?? 'friend';

  const onDragOver = useCallback((e: React.DragEvent) => {
    if (e.dataTransfer.types.includes('application/mikoto-tab')) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      setDragOver(true);
    }
  }, []);

  const onDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const rawTab = e.dataTransfer.getData('application/mikoto-tab');
      if (!rawTab) return;
      const tab: Tabable = JSON.parse(rawTab);
      tabkit.openTab(tab, true);
    },
    [tabkit],
  );

  const openCreateSpace = useCallback(() => {
    modal(<SpaceJoinModal />);
  }, [modal]);

  return (
    <Box
      w="100%"
      h="100%"
      bg="subsurface"
      overflowY="auto"
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      position="relative"
    >
      <Box
        position="absolute"
        inset={0}
        pointerEvents="none"
        opacity={0.04}
        backgroundImage="radial-gradient(circle, var(--chakra-colors-blue-400) 1px, transparent 1px)"
        backgroundSize="28px 28px"
      />

      {dragOver && (
        <Box
          position="absolute"
          inset={0}
          bg="hsla(230, 16%, 27%, 0.6)"
          zIndex={2}
          pointerEvents="none"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Text fontSize="lg" fontWeight={600} color="gray.50">
            Drop to open channel
          </Text>
        </Box>
      )}

      <Box
        maxW="880px"
        mx="auto"
        px={{ base: 6, md: 10 }}
        py={{ base: 8, md: 12 }}
        position="relative"
        zIndex={1}
      >
        <Text
          fontSize="xs"
          fontWeight={600}
          letterSpacing="0.12em"
          color="gray.400"
          textTransform="uppercase"
          mb={2}
        >
          Welcome, {greetingName} — Let's find your people
        </Text>
        <Heading
          fontSize={{ base: '3xl', md: '4xl' }}
          fontWeight={700}
          color="gray.50"
          lineHeight={1.15}
          mb={3}
        >
          Mikoto is more fun with company
        </Heading>
        <Text fontSize="sm" color="gray.400" mb={8}>
          Jump into a community below, or create your own space in the sidebar.
        </Text>

        <Flex
          align="center"
          gap={5}
          p={5}
          rounded="lg"
          bg="gray.800"
          borderWidth="1px"
          borderColor="gray.700"
          mb={8}
        >
          <Flex
            align="center"
            justify="center"
            flexShrink={0}
            w="56px"
            h="56px"
            rounded="md"
            bg="blue.600"
            color="white"
          >
            <FontAwesomeIcon icon={faMikoto} fontSize="28px" />
          </Flex>
          <Box flex={1} minW={0}>
            <Flex align="center" gap={2} mb={1}>
              <Heading
                as="h3"
                m={0}
                fontSize="lg"
                fontWeight={700}
                color="gray.50"
              >
                The Mikoto Lounge
              </Heading>
              <Badge
                colorPalette="primary"
                variant="solid"
                fontSize="2xs"
                letterSpacing="0.08em"
                textTransform="uppercase"
              >
                Official
              </Badge>
            </Flex>
            <Text fontSize="sm" color="gray.400" mb={1.5}>
              The place to meet other Mikoto users, ask questions, and shape the
              roadmap.
            </Text>
            <Flex align="center" gap={2} fontSize="xs" color="gray.450">
              <Box w="6px" h="6px" rounded="full" bg="#34D399" />
              <Text>847 online · 24,301 members</Text>
            </Flex>
          </Box>
          <Button colorPalette="primary" size="md" flexShrink={0}>
            Join Lounge
          </Button>
        </Flex>

        <Text
          fontSize="xs"
          fontWeight={700}
          letterSpacing="0.12em"
          color="gray.350"
          textTransform="uppercase"
          mb={3}
        >
          Popular this week
        </Text>
        <Box
          display="grid"
          gridTemplateColumns={{
            base: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(3, 1fr)',
          }}
          gap={3}
          mb={8}
        >
          {POPULAR.map((c) => (
            <CommunityCard key={c.id} community={c} />
          ))}
        </Box>

        <Flex
          align="center"
          gap={4}
          p={5}
          rounded="lg"
          bg="gray.800"
          borderWidth="1px"
          borderColor="gray.700"
        >
          <Box flex={1} minW={0}>
            <Heading
              as="h3"
              m={0}
              fontSize="sm"
              fontWeight={600}
              color="gray.50"
              mb={1}
            >
              Nothing catching your eye?
            </Heading>
            <Text fontSize="xs" color="gray.400">
              Create your own space — invite your crew, make it yours.
            </Text>
          </Box>
          <Button
            colorPalette="primary"
            variant="solid"
            size="md"
            flexShrink={0}
            onClick={openCreateSpace}
          >
            + Create Space
          </Button>
        </Flex>
      </Box>
    </Box>
  );
}
