import { CodeNode, CodeHighlightNode } from "@lexical/code";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import { ListNode, ListItemNode } from "@lexical/list";
import { HorizontalRuleNode } from "@lexical/react/LexicalHorizontalRuleNode";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { TableCellNode, TableRowNode, TableNode } from "@lexical/table";
import { Klass, LexicalNode } from "lexical";

export const MARKDOWN_NODES: Klass<LexicalNode>[] = [
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
