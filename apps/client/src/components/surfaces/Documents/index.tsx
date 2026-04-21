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
import { CollaborationPlugin } from '@lexical/react/LexicalCollaborationPlugin';
import { LexicalCollaboration } from '@lexical/react/LexicalCollaborationContext';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { MikotoChannel } from '@mikoto-io/mikoto.js';
import { useSuspenseQuery } from '@tanstack/react-query';
import { debounce } from 'lodash';
import { PropsWithChildren, useCallback, useRef, useState } from 'react';
import { proxy, useSnapshot } from 'valtio';

import { Surface } from '@/components/Surface';
import { TabName } from '@/components/tabs';
import { useInterval, useMikoto } from '@/hooks';
import { createTooltip } from '@/ui';

import { EDITOR_NODES } from './editorNodes';
import { CodeBlockPlugin } from './plugins/CodeBlockPlugin';
import { FloatingToolbarPlugin } from './plugins/FloatingToolbarPlugin';
import { HotkeyPlugin } from './plugins/HotkeyPlugin';
import { ListBehaviorPlugin } from './plugins/ListBehaviorPlugin';
import { MarkdownPastePlugin } from './plugins/MarkdownPastePlugin';
import { useProviderFactory } from './providerFactory';
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

// shouldPreserveNewLines=true makes Lexical's markdown import/export keep empty
// paragraphs 1:1 with blank lines, so round-tripping between read and edit
// modes doesn't collapse or multiply newlines.
function markdownToEditor(markdown: string): void {
  $convertFromMarkdownString(markdown, TRANSFORMERS, undefined, true);
}

function editorToMarkdown(): string {
  return $convertToMarkdownString(TRANSFORMERS, undefined, true);
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
  const { data } = useSuspenseQuery({
    queryKey: ['documents.editor-init', channel.spaceId, channel.id],
    queryFn: async () => {
      // Fetch the document and claim bootstrap rights in parallel. Only one
      // client per session gets shouldBootstrap=true, which prevents the
      // duplicate-content race when multiple peers open a cold room together.
      const [document, shouldBootstrap] = await Promise.all([
        channel.getDocument(),
        channel.claimDocumentBootstrap(),
      ]);
      return { document, shouldBootstrap };
    },
  });

  return (
    <LexicalCollaboration>
      <LexicalComposer
        initialConfig={{
          namespace: 'Editor',
          editable: true,
          nodes: EDITOR_NODES,
          theme: lexicalTheme,
          editorState: null,
          onError(error: Error) {
            throw error;
          },
        }}
      >
        <DocumentEditorInner
          channel={channel}
          documentState={documentState}
          initialContent={data.document.content}
          shouldBootstrap={data.shouldBootstrap}
        />
      </LexicalComposer>
    </LexicalCollaboration>
  );
}

const CURSOR_COLORS = [
  '#f87171',
  '#fb923c',
  '#facc15',
  '#a3e635',
  '#34d399',
  '#22d3ee',
  '#60a5fa',
  '#a78bfa',
  '#f472b6',
];

function cursorColorFor(userId: string): string {
  return CURSOR_COLORS[Math.abs(hash(userId)) % CURSOR_COLORS.length];
}

function DocumentEditorInner({
  channel,
  documentState,
  initialContent,
  shouldBootstrap,
}: {
  channel: MikotoChannel;
  documentState: DocumentState;
  initialContent: string;
  shouldBootstrap: boolean;
}) {
  const mikoto = useMikoto();
  const { providerFactory } = useProviderFactory({ channel });
  const me = mikoto.user.me;
  const username = me?.name ?? 'Anonymous';
  const cursorColor = me ? cursorColorFor(me.id) : CURSOR_COLORS[0];

  // CollaborationPlugin has initialEditorState in its effect dep list, so
  // passing a fresh function every render tears down and reconnects the
  // provider on each re-render — which turned into an infinite reconnect
  // loop once setSynced re-renders fed back into it.
  const initialEditorState = useCallback(
    () => markdownToEditor(initialContent),
    [initialContent],
  );

  return (
    <>
      <RichTextPlugin
        contentEditable={<MikotoContentEditable />}
        placeholder={<></>}
        ErrorBoundary={LexicalErrorBoundary}
      />
      <MarkdownShortcutPlugin />
      <MarkdownPastePlugin />
      <AutoFocusPlugin />
      <AutoLinkPlugin matchers={LINK_MATCHERS} />
      <HotkeyPlugin channel={channel} />
      <ListBehaviorPlugin />
      <CodeBlockPlugin />
      <FloatingToolbarPlugin />
      <CollaborationPlugin
        id={channel.id}
        // y-websocket's awareness type is slightly looser than Lexical's;
        // structural shape matches at runtime.
        providerFactory={providerFactory as never}
        username={username}
        cursorColor={cursorColor}
        shouldBootstrap={shouldBootstrap}
        initialEditorState={initialEditorState}
      />
      <DocumentAutosave channel={channel} documentState={documentState} />
    </>
  );
}

function DocumentAutosave({
  channel,
  documentState,
}: {
  channel: MikotoChannel;
  documentState: DocumentState;
}) {
  const [editor] = useLexicalComposerContext();

  const save = useCallback(
    debounce(() => {
      documentState.save = 'saving';
      const content = editor
        .getEditorState()
        .read(() => editorToMarkdown());
      channel
        .updateDocument({ content })
        .then(() => {
          documentState.save = 'synced';
        })
        .catch(() => {
          documentState.save = 'error';
        });
    }, 1500),
    [channel, documentState, editor],
  );

  return <OnChangePlugin ignoreSelectionChange onChange={save} />;
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
