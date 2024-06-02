import { CodeHighlightNode, CodeNode } from '@lexical/code';
import { AutoLinkNode, LinkNode } from '@lexical/link';
import { ListItemNode, ListNode } from '@lexical/list';
import { HorizontalRuleNode } from '@lexical/react/LexicalHorizontalRuleNode';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { TableCellNode, TableNode, TableRowNode } from '@lexical/table';
import { Klass, LexicalNode } from 'lexical';

export const EDITOR_NODES: Klass<LexicalNode>[] = [
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
