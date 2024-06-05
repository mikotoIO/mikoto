import { Box, Heading } from '@chakra-ui/react';
import styled from '@emotion/styled';
import { faFileLines } from '@fortawesome/free-solid-svg-icons';
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
import { ClientChannel } from 'mikotojs';
import { useEffect, useState } from 'react';

import { Surface } from '@/components/Surface';
import { TabName } from '@/components/tabs';
import { useInterval, useMikoto } from '@/hooks';

import { EditorContextBar } from './EditorContextBar';
import { EDITOR_NODES } from './editorNodes';
import DraggableBlockPlugin from './plugins/DraggableBlockPlugin';
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
  channel: ClientChannel;
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
          placeholder={<div></div>}
          ErrorBoundary={LexicalErrorBoundary}
        />
      </EditorWrapper>
      <CollaborationPlugin
        id={channel.id}
        shouldBootstrap={true}
        providerFactory={providerFactory}
        username={mikoto.me.name}
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
      {/* <AutoLinkPlugin /> */}

      <AutoFocusPlugin />
      <SaveLoadPlugin channel={channel} />
    </Box>
  );
}

export default function DocumentSurfaceNext({
  channelId,
}: {
  channelId: string;
}) {
  const mikoto = useMikoto();
  const channel = mikoto.channels.get(channelId)!;
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
    mikoto.client.documents.get({ channelId }).then((x) => {
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
