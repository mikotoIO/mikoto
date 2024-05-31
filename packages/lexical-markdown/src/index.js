"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MARKDOWN_NODES = void 0;
const code_1 = require("@lexical/code");
const link_1 = require("@lexical/link");
const list_1 = require("@lexical/list");
const LexicalHorizontalRuleNode_1 = require("@lexical/react/LexicalHorizontalRuleNode");
const rich_text_1 = require("@lexical/rich-text");
const table_1 = require("@lexical/table");
exports.MARKDOWN_NODES = [
    rich_text_1.HeadingNode,
    rich_text_1.QuoteNode,
    LexicalHorizontalRuleNode_1.HorizontalRuleNode,
    link_1.AutoLinkNode,
    link_1.LinkNode,
    list_1.ListNode,
    list_1.ListItemNode,
    table_1.TableCellNode,
    table_1.TableRowNode,
    table_1.TableNode,
    code_1.CodeNode,
    code_1.CodeHighlightNode,
];
