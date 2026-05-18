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
          Hi there, {greetingName}
        </Text>
        <Heading
          fontSize={{ base: 'xl', md: '2xl' }}
          fontWeight={700}
          color="gray.50"
          lineHeight={1.15}
          mb={3}
        >
          Mikoto Platforms
        </Heading>

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
                Mikoto Official Space
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
              The place to meet other Mikoto users, ask questions about the
              development, and shape the roadmap.
            </Text>
          </Box>
          <Button asChild size="md" flexShrink={0}>
            <a
              href="https://platform.mikoto.io/invite/WtvbKS7mrLSd"
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: 'none' }}
            >
              Join Official Space
            </a>
          </Button>
        </Flex>

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
