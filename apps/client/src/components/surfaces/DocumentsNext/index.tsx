import { Box, Flex, Heading } from '@chakra-ui/react';
import styled from '@emotion/styled';
import {
  faBookAtlas,
  faFileLines,
  faPencilSquare,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { $convertFromMarkdownString, TRANSFORMERS } from '@lexical/markdown';
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import { CollaborationPlugin } from '@lexical/react/LexicalCollaborationPlugin';
import {
  InitialConfigType,
  LexicalComposer,
} from '@lexical/react/LexicalComposer';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { MikotoChannel } from '@mikoto-io/mikoto.js';
import { useSuspenseQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { Surface } from '@/components/Surface';
import { TabName } from '@/components/tabs';
import { useInterval, useMikoto } from '@/hooks';
import { createTooltip } from '@/ui';

import { EditorContextBar } from './EditorContextBar';
import { EDITOR_NODES } from './editorNodes';
import { SaveLoadPlugin } from './plugins/SaveLoadPlugin';
import { useProviderFactory } from './providerFactory';
import { lexicalTheme } from './theme';

const EditorWrapper = styled.div`
  line-height: 1.1;
  position: relative;

  blockquote {
    border-left: 2px solid var(--chakra-colors-gray-600);
    color: var(--chakra-colors-gray-400);
    margin: 0;
    padding-left: 1em;
  }
`;

function DocumentEditor({
  channel,
  content,
}: {
  channel: MikotoChannel;
  content: string;
}) {
  const mikoto = useMikoto();

  const [editor] = useLexicalComposerContext();
  const { providerFactory, save, synced, setSynced } = useProviderFactory({
    channel,
    content,
    onSync() {
      editor.setEditable(true);
    },
  });

  useInterval(() => {
    if (synced === 'syncing') {
      save();
    }
  }, 5000);

  const [floatingAnchorElem, setFloatingAnchorElem] =
    useState<HTMLDivElement | null>(null);
  const onRef = (_floatingAnchorElem: HTMLDivElement) => {
    if (_floatingAnchorElem !== null) {
      setFloatingAnchorElem(_floatingAnchorElem);
    }
  };

  return (
    <Box>
      <EditorContextBar syncState={synced} />
      <EditorWrapper ref={onRef}>
        <RichTextPlugin
          contentEditable={
            <ContentEditable
              className="editor-input"
              style={{
                outline: 'none',
              }}
            />
          }
          placeholder={
            <Box color="gray.500" pos="absolute" top={0} pointerEvents="none">
              Write something here...
            </Box>
          }
          ErrorBoundary={LexicalErrorBoundary}
        />
      </EditorWrapper>
      <CollaborationPlugin
        id={channel.id}
        shouldBootstrap={true}
        providerFactory={providerFactory}
        username={mikoto.user.me!.name}
      />
      <OnChangePlugin
        ignoreSelectionChange
        onChange={() => {
          setSynced('syncing');
        }}
      />
      <MarkdownShortcutPlugin />
      {floatingAnchorElem && (
        <>{/* <DraggableBlockPlugin anchorElem={floatingAnchorElem} /> */}</>
      )}

      <AutoFocusPlugin />
      <SaveLoadPlugin channel={channel} />
    </Box>
  );
}

export function DocumentSurfaceNext({ channelId }: { channelId: string }) {
  const mikoto = useMikoto();
  const channel = mikoto.channels._get(channelId)!;
  const [content, setContent] = useState<string | null>(null);

  // lexical context
  const initialConfig: InitialConfigType = {
    namespace: 'Editor',
    editable: false,
    nodes: EDITOR_NODES,
    theme: lexicalTheme,
    editorState: null,
    onError(error: Error) {
      throw error;
    },
  };

  useEffect(() => {
    mikoto.rest['documents.get']({
      params: {
        spaceId: channel.spaceId,
        channelId,
      },
    }).then((x) => {
      setContent(x.content);
    });
  }, [channelId]);

  return (
    <Surface scroll>
      <TabName name={channel.name} icon={faFileLines} />
      <Box p={8}>
        <Heading fontSize="28px" color="gray.100">
          <Box as="span" color="gray.300">
            #
          </Box>
          {channel.name}
        </Heading>

        {content !== null && (
          <LexicalComposer initialConfig={initialConfig}>
            <DocumentEditor channel={channel} content={content} />
          </LexicalComposer>
        )}
      </Box>
    </Surface>
  );
}

const ActionTooltip = createTooltip({
  animation: false,
  placement: 'bottom',
  offset: [0, 4],
});

function DocumentActions({ channel }: { channel: MikotoChannel }) {
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
      <Box className="left">#{channel.name}</Box>
      <Flex className="right" fontSize="xl" gap={3}>
        <ActionTooltip tooltip="Edit">
          <FontAwesomeIcon icon={faPencilSquare} />
        </ActionTooltip>
        <ActionTooltip tooltip="Publish">
          <FontAwesomeIcon icon={faBookAtlas} />
        </ActionTooltip>
      </Flex>
    </Flex>
  );
}

interface DocumentReaderProps {
  content: string;
}

function DocumentReader({ content }: DocumentReaderProps) {
  return (
    <LexicalComposer
      initialConfig={{
        namespace: 'Editor',
        editable: false,
        nodes: EDITOR_NODES,
        theme: lexicalTheme,
        editorState: () => $convertFromMarkdownString(content, TRANSFORMERS),
        // editorState: markdownToEditorS
        onError(error: Error) {
          throw error;
        },
      }}
    >
      <RichTextPlugin
        contentEditable={
          <ContentEditable
            className="editor-input"
            style={{
              outline: 'none',
            }}
          />
        }
        placeholder={
          <Flex
            color="gray.500"
            top={0}
            justify="center"
            pointerEvents="none"
            align="center"
            direction="column"
          >
            <Box mb={8}>
              <FontAwesomeIcon
                icon={faFileLines}
                fontSize="100px"
                opacity={0.2}
              />
            </Box>
            <Box>It's a blank page for now.</Box>
            <Box>but also an empty canvas to write something beautiful.</Box>
          </Flex>
        }
        ErrorBoundary={LexicalErrorBoundary}
      />
    </LexicalComposer>
  );
}

export default function DocumentSurface({ channelId }: { channelId: string }) {
  const mikoto = useMikoto();
  const channel = mikoto.channels._get(channelId)!;

  const { data: document } = useSuspenseQuery({
    queryKey: ['documents.get', channel.spaceId, channel.id],
    queryFn: async () => {
      return await mikoto.rest['documents.get']({
        params: {
          spaceId: channel.spaceId,
          channelId,
        },
      });
    },
  });

  return (
    <Surface scroll padded>
      <TabName name={channel.name} icon={faFileLines} />
      <DocumentActions channel={channel} />
      <DocumentReader content={document.content} />
    </Surface>
  );
}
