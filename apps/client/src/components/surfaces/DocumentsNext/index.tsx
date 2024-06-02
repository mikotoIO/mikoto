import { Box, Flex, Heading, Spinner } from '@chakra-ui/react';
import {
  faEllipsis,
  faFileLines,
  faSquareCheck,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { HocuspocusProvider } from '@hocuspocus/provider';
import {
  $convertFromMarkdownString,
  $convertToMarkdownString,
  TRANSFORMERS,
} from '@lexical/markdown';
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
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import * as Y from 'yjs';

import { ContextMenu, useContextMenuX } from '@/components/ContextMenu';
import { Surface } from '@/components/Surface';
import { TabName } from '@/components/tabs';
import { env } from '@/env';
import { useInterval, useMikoto } from '@/hooks';

import { EDITOR_NODES } from './editorNodes';
import { SaveLoadPlugin } from './plugins/SaveLoadPlugin';
import { lexicalTheme } from './theme';

function getDocFromMap(id: string, yjsDocMap: Map<string, Y.Doc>): Y.Doc {
  let doc = yjsDocMap.get(id);

  if (doc === undefined) {
    doc = new Y.Doc();
    yjsDocMap.set(id, doc);
  } else {
    doc.load();
  }
  return doc;
}

interface UseProviderFactoryProps {
  channel: ClientChannel;
  content: string;
  onSync?: () => void;
}

function useProviderFactory({
  channel,
  content,
  onSync,
}: UseProviderFactoryProps) {
  const [synced, setSynced] = useState(false);
  const [editor] = useLexicalComposerContext();

  const providerFactory = useCallback(
    (id: string, yjsDocMap: Map<string, Y.Doc>) => {
      const doc = new Y.Doc();
      yjsDocMap.set(id, doc);

      const hocuspocus = new HocuspocusProvider({
        url: env.PUBLIC_COLLABORATION_URL,
        name: channel.id,
        document: doc,
      });

      hocuspocus.on('synced', () => {
        if (doc.store.clients.size === 0) {
          editor.update(
            () => {
              $convertFromMarkdownString(content, TRANSFORMERS);
            },
            { discrete: true },
          );
        }
        onSync?.();
        setSynced(true);
      });

      return hocuspocus as any;
    },
    [],
  );

  return { providerFactory, synced };
}

function DocumentEditor({
  channel,
  content,
}: {
  channel: ClientChannel;
  content: string;
}) {
  const mikoto = useMikoto();

  const [editorContent, setEditorContent] = useState(content);

  const [editor] = useLexicalComposerContext();
  const { providerFactory } = useProviderFactory({
    channel,
    content,
    onSync() {
      editor.setEditable(true);
    },
  });

  const save = () => {
    const contentString = editor
      .getEditorState()
      .read(() => $convertToMarkdownString(TRANSFORMERS));

    if (contentString === editorContent) {
      setChanged(false);
      return;
    }
    setEditorContent(contentString);

    mikoto.client.documents
      .update({ channelId: channel.id, content: contentString })
      .then(() => setChanged(false))
      .catch((e) => {
        console.error(e);
        setChanged(true);
      });
  };

  const [changed, setChanged] = useState(false);
  useInterval(() => {
    if (changed) {
      save();
    }
  }, 5000);

  const contextMenu = useContextMenuX();

  return (
    <Box>
      <div>
        <Flex
          w="100%"
          h={8}
          bg="gray.800"
          rounded="md"
          px={4}
          mb={4}
          align="center"
          justify="space-between"
        >
          <FontAwesomeIcon
            icon={faEllipsis}
            onClick={contextMenu(() => (
              <ContextMenu>
                <ContextMenu.Link
                  onClick={() => {
                    if (!editor) return;
                    const text = editor
                      .getEditorState()
                      .read(() => $convertToMarkdownString(TRANSFORMERS));
                    navigator.clipboard.writeText(text);
                    toast('Copied Markdown to clipboard');
                  }}
                >
                  Copy Markdown
                </ContextMenu.Link>
              </ContextMenu>
            ))}
          />
          <Flex gap={2}>
            {changed ? (
              <Spinner size="xs" speed="0.5s" />
            ) : (
              <FontAwesomeIcon icon={faSquareCheck} />
            )}
          </Flex>
        </Flex>
      </div>
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
      <CollaborationPlugin
        id={channel.id}
        shouldBootstrap={false}
        providerFactory={providerFactory}
        username={mikoto.me.name}
      />
      <OnChangePlugin
        onChange={() => {
          setChanged(true);
        }}
      />
      <MarkdownShortcutPlugin />

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
