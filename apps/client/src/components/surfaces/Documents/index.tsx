import { Box, Button, Flex, Group } from '@chakra-ui/react';
import styled from '@emotion/styled';
import {
  faBookAtlas,
  faFileLines,
  faPencilSquare,
  faSave,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { $convertFromMarkdownString, TRANSFORMERS } from '@lexical/markdown';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { MikotoChannel } from '@mikoto-io/mikoto.js';
import { useSuspenseQuery } from '@tanstack/react-query';
import { PropsWithChildren, useRef, useState } from 'react';
import { proxy, useSnapshot } from 'valtio';

import { Surface } from '@/components/Surface';
import { TabName } from '@/components/tabs';
import { useInterval, useMikoto } from '@/hooks';
import { createTooltip } from '@/ui';

import { CollabMarkdownEditor } from './CollabMarkdownEditor';
import { EDITOR_NODES } from './editorNodes';
import { lexicalTheme } from './theme';

const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

function formatRelativeTime(date: Date): string {
  const now = Date.now();
  const diffMs = date.getTime() - now;
  const diffSec = Math.round(diffMs / 1000);
  const diffMin = Math.round(diffMs / 60000);
  const diffHr = Math.round(diffMs / 3600000);
  const diffDay = Math.round(diffMs / 86400000);

  if (Math.abs(diffSec) < 60) return rtf.format(diffSec, 'second');
  if (Math.abs(diffMin) < 60) return rtf.format(diffMin, 'minute');
  if (Math.abs(diffHr) < 24) return rtf.format(diffHr, 'hour');
  return rtf.format(diffDay, 'day');
}

function useRelativeTime(date: Date | undefined): string | undefined {
  const [, setTick] = useState(0);

  useInterval(() => {
    setTick((t) => t + 1);
  }, 10000);

  if (!date) return undefined;
  return formatRelativeTime(date);
}

// Zero-width space used as placeholder for empty lines
const ZERO_WIDTH_SPACE = '\u200B';

// Preserve multiple line breaks in markdown
// Standard markdown collapses multiple newlines, so we use zero-width spaces
function markdownToEditor(markdown: string): void {
  // Each ZWS paragraph represents 2 extra newlines in markdown
  // So for N newlines, we need (N-2)/2 ZWS paragraphs
  const preserved = markdown.replace(/\n{3,}/g, (match) => {
    const numZwsParagraphs = Math.floor((match.length - 2) / 2);
    if (numZwsParagraphs < 1) return '\n\n';
    const zwsContent = Array(numZwsParagraphs)
      .fill(ZERO_WIDTH_SPACE)
      .join('\n\n');
    return '\n\n' + zwsContent + '\n\n';
  });
  $convertFromMarkdownString(preserved, TRANSFORMERS);
}

const EditorWrapper = styled.div`
  line-height: 1.1;
  position: relative;
  cursor: text;

  .editor-input {
    outline: none;
    min-height: calc(100dvh - 200px);
  }

  blockquote {
    border-left: 2px solid var(--chakra-colors-gray-600);
    color: var(--chakra-colors-gray-400);
    margin: 0;
    padding-left: 1em;
  }

  a {
    color: #00aff4;
  }

  .editor-code {
    display: block;
    background-color: var(--chakra-colors-gray-800);
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.9em;
    line-height: 1.5;
    padding: 12px 16px;
    margin: 8px 0;
    overflow-x: auto;
    tab-size: 2;
    white-space: pre;
  }

  .editor-text-code {
    background-color: var(--chakra-colors-gray-800);
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.9em;
    padding: 1px 4px;
  }
`;

function MikotoContentEditable() {
  const [editor] = useLexicalComposerContext();

  const handleClick = () => {
    editor.focus();
  };

  return (
    <EditorWrapper onClick={handleClick}>
      <ContentEditable className="editor-input" />
    </EditorWrapper>
  );
}

const ActionTooltip = createTooltip({
  placement: 'bottom',
  offset: [0, 4],
});

function DocumentActions({ children }: PropsWithChildren) {
  return (
    <Flex
      borderBottom="1px solid"
      borderBottomColor="gray.650"
      px={4}
      py={2}
      mb={8}
      align="center"
      justify="space-between"
    >
      {children}
    </Flex>
  );
}

function DocumentReaderPlaceholder() {
  return (
    <Flex
      color="gray.500"
      top={0}
      justify="center"
      pointerEvents="none"
      align="center"
      direction="column"
    >
      <Box mb={8}>
        <FontAwesomeIcon icon={faFileLines} fontSize="100px" opacity={0.2} />
      </Box>
      <Box>It&apos;s a blank page for now.</Box>
      <Box>but also an empty canvas to write something beautiful.</Box>
    </Flex>
  );
}

interface DocumentState {
  type: 'read' | 'edit';
}

function hash(str: string) {
  let hash = 0;
  if (str.length === 0) return hash;
  for (let i = 0; i < str.length; i++) {
    const chr = str.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
}

function DocumentReader({ channel }: { channel: MikotoChannel }) {
  const { data: document } = useSuspenseQuery({
    queryKey: ['documents.get', channel.spaceId, channel.id],
    queryFn: async () => {
      return channel.getDocument();
    },
  });

  return (
    <LexicalComposer
      key={hash(document.content)}
      initialConfig={{
        namespace: 'Editor',
        editable: false,
        nodes: EDITOR_NODES,
        theme: lexicalTheme,
        editorState: () => markdownToEditor(document.content),
        onError(error: Error) {
          throw error;
        },
      }}
    >
      <RichTextPlugin
        contentEditable={<MikotoContentEditable />}
        placeholder={<DocumentReaderPlaceholder />}
        ErrorBoundary={LexicalErrorBoundary}
      />
    </LexicalComposer>
  );
}

function DocumentEditor({ channel }: { channel: MikotoChannel }) {
  return <CollabMarkdownEditor key={channel.id} channel={channel} />;
}

export default function DocumentSurface({ channelId }: { channelId: string }) {
  const mikoto = useMikoto();
  const channel = mikoto.channels._get(channelId)!;
  const documentState = useRef<DocumentState>(
    proxy({
      type: 'read',
    }),
  ).current;
  const documentSnap = useSnapshot(documentState);
  const lastEdited = useRelativeTime(channel.lastUpdatedDate);

  return (
    <Surface scroll>
      <TabName
        name={channel.name}
        icon={channel.space?.icon ?? faFileLines}
        spaceId={channel.space?.id}
        spaceName={channel.space?.name}
      />
      <DocumentActions>
        <Flex className="left" direction="column">
          <Box fontWeight="semibold" color="gray.200">
            {channel.name}
          </Box>
          {lastEdited && (
            <Box fontSize="xs" color="gray.500">
              edited {lastEdited}
            </Box>
          )}
        </Flex>
        <Flex className="right" fontSize="xl" gap={3}>
          <Group>
            <ActionTooltip tooltip="Edit">
              <Button
                variant="ghost"
                p={2}
                onClick={() => {
                  if (documentSnap.type === 'read') {
                    documentState.type = 'edit';
                  } else if (documentSnap.type === 'edit') {
                    documentState.type = 'read';
                  }
                }}
              >
                {documentSnap.type === 'read' ? (
                  <FontAwesomeIcon icon={faPencilSquare} />
                ) : (
                  <FontAwesomeIcon icon={faSave} />
                )}
              </Button>
            </ActionTooltip>
            <ActionTooltip tooltip="Publish">
              <Button p={2} variant="ghost">
                <FontAwesomeIcon icon={faBookAtlas} />
              </Button>
            </ActionTooltip>
          </Group>
        </Flex>
      </DocumentActions>
      <Box px={8}>
        {documentSnap.type === 'read' && <DocumentReader channel={channel} />}
        {documentSnap.type === 'edit' && <DocumentEditor channel={channel} />}
      </Box>
    </Surface>
  );
}
