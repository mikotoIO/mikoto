import { Box, Button, Flex, Group } from '@chakra-ui/react';
import styled from '@emotion/styled';
import {
  faBookAtlas,
  faCircleNotch,
  faFileLines,
  faPencilSquare,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  $convertFromMarkdownString,
  $convertToMarkdownString,
  TRANSFORMERS,
} from '@lexical/markdown';
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { MikotoChannel } from '@mikoto-io/mikoto.js';
import { useSuspenseQuery } from '@tanstack/react-query';
import { EditorState } from 'lexical';
import { debounce } from 'lodash';
import { PropsWithChildren, useCallback, useRef } from 'react';
import { proxy, useSnapshot } from 'valtio';

import { Surface } from '@/components/Surface';
import { TabName } from '@/components/tabs';
import { useMikoto } from '@/hooks';
import { createTooltip } from '@/ui';

import { EDITOR_NODES } from './editorNodes';
import { HotkeyPlugin } from './plugins/HotkeyPlugin';
import { lexicalTheme } from './theme';

const EditorWrapper = styled.div`
  line-height: 1.1;
  position: relative;

  .editor-input {
    outline: none;
  }

  blockquote {
    border-left: 2px solid var(--chakra-colors-gray-600);
    color: var(--chakra-colors-gray-400);
    margin: 0;
    padding-left: 1em;
  }
`;

function MikotoContentEditable() {
  return (
    <EditorWrapper>
      <ContentEditable className="editor-input" />
    </EditorWrapper>
  );
}

const ActionTooltip = createTooltip({
  animation: false,
  placement: 'bottom',
  offset: [0, 4],
});

function DocumentActions({ children }: PropsWithChildren) {
  return (
    <Flex
      bg="gray.750"
      px={4}
      py={2}
      mb={4}
      rounded="md"
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
  save: 'synced' | 'saving' | 'error';
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
        editorState: () =>
          $convertFromMarkdownString(document.content, TRANSFORMERS),
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

function DocumentEditor({
  channel,
  documentState,
}: {
  channel: MikotoChannel;
  documentState: DocumentState;
}) {
  const { data: document } = useSuspenseQuery({
    queryKey: ['documents.get', channel.spaceId, channel.id],
    queryFn: async () => {
      return channel.getDocument();
    },
  });

  const onChange = useCallback(
    debounce((editorState: EditorState) => {
      documentState.save = 'saving';
      const content = editorState.read(() =>
        $convertToMarkdownString(TRANSFORMERS),
      );
      channel
        .updateDocument({ content })
        .then(() => {
          documentState.save = 'synced';
        })
        .catch(() => {
          documentState.save = 'error';
        });
    }, 1000),
    [],
  );

  return (
    <LexicalComposer
      initialConfig={{
        namespace: 'Editor',
        editable: true,
        nodes: EDITOR_NODES,
        theme: lexicalTheme,
        editorState: () =>
          $convertFromMarkdownString(document.content, TRANSFORMERS),
        onError(error: Error) {
          throw error;
        },
      }}
    >
      <RichTextPlugin
        contentEditable={<MikotoContentEditable />}
        placeholder={<></>}
        ErrorBoundary={LexicalErrorBoundary}
      />
      <MarkdownShortcutPlugin />
      <AutoFocusPlugin />
      <HotkeyPlugin channel={channel} />
      <OnChangePlugin ignoreSelectionChange onChange={onChange} />
      <HistoryPlugin />
    </LexicalComposer>
  );
}

export default function DocumentSurface({ channelId }: { channelId: string }) {
  const mikoto = useMikoto();
  const channel = mikoto.channels._get(channelId)!;
  const documentState = useRef<DocumentState>(
    proxy({
      type: 'read',
      save: 'synced',
    }),
  ).current;
  const documentSnap = useSnapshot(documentState);

  return (
    <Surface scroll padded>
      <TabName name={channel.name} icon={faFileLines} />
      <DocumentActions>
        <Box className="left">#{channel.name}</Box>
        <Flex className="right" fontSize="xl" gap={3}>
          <Group>
            <ActionTooltip tooltip="Edit">
              <Button
                colorPalette={
                  documentSnap.type === 'edit' ? 'primary' : undefined
                }
                p={2}
                onClick={() => {
                  if (documentSnap.type === 'read') {
                    documentState.type = 'edit';
                  } else if (documentSnap.type === 'edit') {
                    documentState.type = 'read';
                    documentState.save = 'synced';
                  }
                }}
              >
                {documentSnap.save === 'saving' ? (
                  <FontAwesomeIcon icon={faCircleNotch} spin />
                ) : (
                  <FontAwesomeIcon icon={faPencilSquare} />
                )}
              </Button>
            </ActionTooltip>
            <ActionTooltip tooltip="Publish">
              <Button p={2}>
                <FontAwesomeIcon icon={faBookAtlas} />
              </Button>
            </ActionTooltip>
          </Group>
        </Flex>
      </DocumentActions>
      {documentSnap.type === 'read' && <DocumentReader channel={channel} />}
      {documentSnap.type === 'edit' && (
        <DocumentEditor channel={channel} documentState={documentState} />
      )}
    </Surface>
  );
}
