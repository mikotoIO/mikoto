import { Box, Button, Flex, Group } from '@chakra-ui/react';
import styled from '@emotion/styled';
import {
  faBookAtlas,
  faCircleNotch,
  faFileLines,
  faPencilSquare,
  faSave,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  $convertFromMarkdownString,
  $convertToMarkdownString,
  TRANSFORMERS,
} from '@lexical/markdown';
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import {
  AutoLinkPlugin,
  createLinkMatcherWithRegExp,
} from '@lexical/react/LexicalAutoLinkPlugin';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
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
import { EmptyParagraphPlugin } from './plugins/EmptyParagraphPlugin';
import { HotkeyPlugin } from './plugins/HotkeyPlugin';
import { ListBehaviorPlugin } from './plugins/ListBehaviorPlugin';
import { lexicalTheme } from './theme';

// Zero-width space used as placeholder for empty lines
const ZERO_WIDTH_SPACE = '\u200B';

const URL_REGEX =
  /((https?:\/\/(www\.)?)|(www\.))[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/;

const EMAIL_REGEX =
  /(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/;

const LINK_MATCHERS = [
  createLinkMatcherWithRegExp(URL_REGEX, (text) =>
    text.startsWith('http') ? text : `https://${text}`,
  ),
  createLinkMatcherWithRegExp(EMAIL_REGEX, (text) => `mailto:${text}`),
];

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

function editorToMarkdown(): string {
  const markdown = $convertToMarkdownString(TRANSFORMERS);
  // Remove zero-width space placeholders - they just become empty lines
  return markdown.replace(new RegExp(ZERO_WIDTH_SPACE, 'g'), '');
}

const EditorWrapper = styled.div`
  line-height: 1.1;
  position: relative;
  cursor: text;

  .editor-input {
    outline: none;
    min-height: calc(100vh - 200px);
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
  animation: false,
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
      const content = editorState.read(() => editorToMarkdown());
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
        editorState: () => markdownToEditor(document.content),
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
      <AutoLinkPlugin matchers={LINK_MATCHERS} />
      <HotkeyPlugin channel={channel} />
      <ListBehaviorPlugin />
      <EmptyParagraphPlugin />
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
    <Surface scroll>
      <TabName name={channel.name} icon={faFileLines} />
      <DocumentActions>
        <Box className="left" fontWeight="semibold" color="gray.400">
          #{channel.name}
        </Box>
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
                    documentState.save = 'synced';
                  }
                }}
              >
                {documentSnap.type === 'read' ? (
                  <FontAwesomeIcon icon={faPencilSquare} />
                ) : documentSnap.save === 'saving' ? (
                  <FontAwesomeIcon icon={faCircleNotch} spin />
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
        {documentSnap.type === 'edit' && (
          <DocumentEditor channel={channel} documentState={documentState} />
        )}
      </Box>
    </Surface>
  );
}
