import { CodeHighlightNode, CodeNode } from '@lexical/code';
import { AutoLinkNode, LinkNode } from '@lexical/link';
import { ListItemNode, ListNode } from '@lexical/list';
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import {
  InitialConfigType,
  LexicalComposer,
} from '@lexical/react/LexicalComposer';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { HorizontalRuleNode } from '@lexical/react/LexicalHorizontalRuleNode';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { TableCellNode, TableNode, TableRowNode } from '@lexical/table';
import { $getRoot } from 'lexical';

import { Surface } from '@/components/Surface';
import { useMikoto } from '@/hooks';

import { lexicalTheme } from './theme';

export default function DocumentSurfaceNext() {
  const initialConfig: InitialConfigType = {
    namespace: 'Playground',
    nodes: [
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
    ],
    theme: lexicalTheme,
    onError(error: Error) {
      throw error;
    },
  };

  return (
    <Surface scroll>
      <LexicalComposer initialConfig={initialConfig}>
        <RichTextPlugin
          contentEditable={
            <ContentEditable
              className="editor-input"
              style={{
                outline: 'none',
                padding: '32px',
              }}
            />
          }
          placeholder={<div></div>}
          ErrorBoundary={LexicalErrorBoundary}
        />
        <MarkdownShortcutPlugin />

        <HistoryPlugin />
        <AutoFocusPlugin />
      </LexicalComposer>
    </Surface>
  );
}
