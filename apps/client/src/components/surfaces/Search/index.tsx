import { Box, Flex, Heading, Input, Spinner, Text } from '@chakra-ui/react';
import styled from '@emotion/styled';
import {
  faFileLines,
  faHashtag,
  faMagnifyingGlass,
  faMessage,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  DocumentSearchResult,
  MessageSearchResult,
} from '@mikoto-io/mikoto.js';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';

import { Surface } from '@/components/Surface';
import { Avatar } from '@/components/atoms/Avatar';
import { TabName } from '@/components/tabs';
import { useMikoto } from '@/hooks';
import { useTabkit } from '@/store/surface';

const ResultRow = styled.button`
  display: flex;
  width: 100%;
  text-align: left;
  align-items: flex-start;
  gap: 12px;
  padding: 10px 12px;
  border: none;
  background: transparent;
  border-radius: 8px;
  cursor: pointer;
  color: inherit;

  &:hover {
    background: var(--chakra-colors-gray-700);
  }

  mark {
    background: var(--chakra-colors-yellow-300);
    color: var(--chakra-colors-gray-900);
    padding: 0 2px;
    border-radius: 2px;
  }
`;

const SectionHeading = styled.h3`
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--chakra-colors-gray-400);
  margin: 16px 4px 8px;
`;

function useDebounced<T>(value: T, delay = 250): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

function renderSnippet(snippet: string): { __html: string } {
  const escaped = snippet
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/&lt;mark&gt;/g, '<mark>')
    .replace(/&lt;\/mark&gt;/g, '</mark>');
  return { __html: escaped };
}

function MessageHit({
  hit,
  onOpen,
}: {
  hit: MessageSearchResult;
  onOpen: () => void;
}) {
  const author = hit.author;
  return (
    <ResultRow onClick={onOpen}>
      <Avatar
        src={author?.avatar ?? undefined}
        userId={author?.id}
        size={36}
      />
      <Box flex={1} minW={0}>
        <Flex gap={2} align="baseline" mb="2px">
          <Text fontWeight="600" fontSize="sm" truncate>
            {author?.name ?? 'Unknown'}
          </Text>
          <Text fontSize="xs" color="gray.500">
            {new Date(hit.timestamp).toLocaleString()}
          </Text>
        </Flex>
        <Text
          fontSize="sm"
          color="gray.200"
          dangerouslySetInnerHTML={renderSnippet(hit.snippet)}
        />
      </Box>
    </ResultRow>
  );
}

function DocumentHit({
  hit,
  onOpen,
}: {
  hit: DocumentSearchResult;
  onOpen: () => void;
}) {
  const mikoto = useMikoto();
  const channel = mikoto.channels.cache.get(hit.channelId);
  return (
    <ResultRow onClick={onOpen}>
      <Box pt="6px" color="gray.400">
        <FontAwesomeIcon icon={faFileLines} fixedWidth />
      </Box>
      <Box flex={1} minW={0}>
        <Flex gap={2} align="baseline" mb="2px">
          <FontAwesomeIcon icon={faHashtag} size="xs" />
          <Text fontWeight="600" fontSize="sm" truncate>
            {channel?.name ?? 'Unknown channel'}
          </Text>
        </Flex>
        <Text
          fontSize="sm"
          color="gray.200"
          dangerouslySetInnerHTML={renderSnippet(hit.snippet)}
        />
      </Box>
    </ResultRow>
  );
}

export function SearchSurface({ spaceId }: { spaceId: string }) {
  const mikoto = useMikoto();
  const tabkit = useTabkit();
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounced(query, 250);
  const trimmedQuery = debouncedQuery.trim();

  const messagesQuery = useQuery({
    queryKey: ['search.messages', spaceId, trimmedQuery],
    queryFn: () =>
      mikoto.rest['search.messages']({
        params: { spaceId },
        queries: { q: trimmedQuery },
      }),
    enabled: trimmedQuery.length > 0,
  });

  const documentsQuery = useQuery({
    queryKey: ['search.documents', spaceId, trimmedQuery],
    queryFn: () =>
      mikoto.rest['search.documents']({
        params: { spaceId },
        queries: { q: trimmedQuery },
      }),
    enabled: trimmedQuery.length > 0,
  });

  const space = useMemo(
    () => mikoto.spaces.cache.get(spaceId),
    [mikoto, spaceId],
  );

  const openChannel = (channelId: string, kind: 'textChannel' | 'documentChannel') => {
    tabkit.openTab(
      {
        kind,
        key: channelId,
        channelId,
      },
      false,
    );
  };

  const isLoading = messagesQuery.isFetching || documentsQuery.isFetching;
  const messageHits = messagesQuery.data ?? [];
  const documentHits = documentsQuery.data ?? [];
  const hasResults = messageHits.length > 0 || documentHits.length > 0;

  return (
    <Surface padded scroll>
      <TabName
        name={space ? `Search · ${space.name}` : 'Search'}
        icon={faMagnifyingGlass}
        spaceId={spaceId}
        spaceName={space?.name}
      />
      <Heading fontSize="xl" mb={4}>
        Search
      </Heading>
      <Box mb={4}>
        <Input
          placeholder="Search messages and documents…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
      </Box>

      {trimmedQuery.length === 0 && (
        <Text color="gray.500" p={2}>
          Start typing to search messages and documents in this space.
        </Text>
      )}

      {trimmedQuery.length > 0 && isLoading && !hasResults && (
        <Flex align="center" gap={2} p={2} color="gray.400">
          <Spinner size="sm" />
          <Text fontSize="sm">Searching…</Text>
        </Flex>
      )}

      {trimmedQuery.length > 0 && !isLoading && !hasResults && (
        <Text color="gray.500" p={2}>
          No results for “{trimmedQuery}”.
        </Text>
      )}

      {messageHits.length > 0 && (
        <Box>
          <SectionHeading>
            <FontAwesomeIcon icon={faMessage} fixedWidth />{' '}
            Messages ({messageHits.length})
          </SectionHeading>
          {messageHits.map((hit) => (
            <MessageHit
              key={hit.id}
              hit={hit}
              onOpen={() => openChannel(hit.channelId, 'textChannel')}
            />
          ))}
        </Box>
      )}

      {documentHits.length > 0 && (
        <Box>
          <SectionHeading>
            <FontAwesomeIcon icon={faFileLines} fixedWidth />{' '}
            Documents ({documentHits.length})
          </SectionHeading>
          {documentHits.map((hit) => (
            <DocumentHit
              key={hit.id}
              hit={hit}
              onOpen={() => openChannel(hit.channelId, 'documentChannel')}
            />
          ))}
        </Box>
      )}
    </Surface>
  );
}

export default SearchSurface;
