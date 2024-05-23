import { Box, Heading } from '@chakra-ui/react';
import { faFileLines } from '@fortawesome/free-solid-svg-icons';
import { HocuspocusProvider } from '@hocuspocus/provider';
import { CodeHighlightNode, CodeNode } from '@lexical/code';
import { AutoLinkNode, LinkNode } from '@lexical/link';
import { ListItemNode, ListNode } from '@lexical/list';
import { $convertFromMarkdownString, TRANSFORMERS } from '@lexical/markdown';
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import { CollaborationPlugin } from '@lexical/react/LexicalCollaborationPlugin';
import {
  InitialConfigType,
  LexicalComposer,
} from '@lexical/react/LexicalComposer';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary';
import { HorizontalRuleNode } from '@lexical/react/LexicalHorizontalRuleNode';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { TableCellNode, TableNode, TableRowNode } from '@lexical/table';
import { $getRoot, Klass, LexicalNode } from 'lexical';
import { ClientChannel } from 'mikotojs';
import { useCallback, useEffect, useState } from 'react';
import { WebsocketProvider } from 'y-websocket';
import * as Y from 'yjs';

import { Surface } from '@/components/Surface';
import { TabName } from '@/components/tabs';
import { env } from '@/env';
import { useMikoto } from '@/hooks';

import { SaveLoadPlugin } from './plugins/SaveLoadPlugin';
import { lexicalTheme } from './theme';

const EDITOR_NODES: Klass<LexicalNode>[] = [
  HeadingNode,
  QuoteNode,
  HorizontalRuleNode,
  AutoLinkNode,
  LinkNode,
  ListNode,
  ListItemNode,
  TableCellNode,
  TableRowNode,
  TableNode,
  CodeNode,
  CodeHighlightNode,
];

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

function DocumentEditor({
  channel,
  content,
}: {
  channel: ClientChannel;
  content: string;
}) {
  const mikoto = useMikoto();

  const initialConfig: InitialConfigType = {
    namespace: 'Editor',
    nodes: EDITOR_NODES,
    theme: lexicalTheme,
    editorState: null,
    onError(error: Error) {
      throw error;
    },
  };

  const providerFactory = useCallback(
    (id: string, yjsDocMap: Map<string, Y.Doc>) => {
      const ydoc = getDocFromMap(id, yjsDocMap);

      const hocuspocus = new HocuspocusProvider({
        url: env.PUBLIC_COLLABORATION_URL,
        name: channel.id,
        document: ydoc,
      }) as any;

      return hocuspocus as any;
    },
    [],
  );

  return (
    <Box>
      <LexicalComposer initialConfig={initialConfig}>
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
        <MarkdownShortcutPlugin />

        <CollaborationPlugin
          id={channel.id}
          shouldBootstrap={true}
          providerFactory={providerFactory}
          username={mikoto.me.name}
        />

        <AutoFocusPlugin />
        <SaveLoadPlugin channel={channel} />
      </LexicalComposer>
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
          <DocumentEditor channel={channel} content={content} />
        )}
      </Box>
    </Surface>
  );
}
