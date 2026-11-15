import { parseEmoji } from '@mikoto-io/mikoto.js';
import {
  $applyNodeReplacement,
  type DOMExportOutput,
  DecoratorNode,
  type EditorConfig,
  type LexicalNode,
  type NodeKey,
  type SerializedLexicalNode,
  type SerializedTextNode,
  type Spread,
  TextNode,
} from 'lexical';
import { type ReactNode, useState } from 'react';

import { useCustomEmojiById } from '@/components/molecules/markdown';

import styles from '../MessageEditor.module.css';
import { emojiImageUrl, useEmojiSet } from '../emojiData';
import type { MarkKind } from './tokenize';

/*
 * Composer nodes. Each one's text content is the markdown it stands for, so
 * the editor's text is always exactly the message that will be sent.
 */

const MARK_CLASS: Record<MarkKind, string | undefined> = {
  bold: styles.mdBold,
  italic: styles.mdItalic,
  strike: styles.mdStrike,
  spoiler: styles.mdSpoiler,
  code: styles.mdCode,
  codeBlock: styles.mdCodeBlock,
  mention: styles.mdMention,
  link: styles.mdLink,
};

export type SerializedMarkdownTokenNode = Spread<
  { kind: MarkKind },
  SerializedTextNode
>;

/** A styled run of markdown (`**bold**`, `@mention`, ...), markers and all. */
export class MarkdownTokenNode extends TextNode {
  __kind: MarkKind;

  static getType(): string {
    return 'md-token';
  }

  static clone(node: MarkdownTokenNode): MarkdownTokenNode {
    return new MarkdownTokenNode(node.__kind, node.__text, node.__key);
  }

  constructor(kind: MarkKind, text: string, key?: NodeKey) {
    super(text, key);
    this.__kind = kind;
  }

  getKind(): MarkKind {
    return this.getLatest().__kind;
  }

  createDOM(config: EditorConfig): HTMLElement {
    const dom = super.createDOM(config);
    const cls = MARK_CLASS[this.__kind];
    if (cls) dom.classList.add(cls);
    return dom;
  }

  updateDOM(prevNode: this, dom: HTMLElement, config: EditorConfig): boolean {
    if (prevNode.__kind !== this.__kind) return true;
    return super.updateDOM(prevNode, dom, config);
  }

  static importJSON(json: SerializedMarkdownTokenNode): MarkdownTokenNode {
    return $createMarkdownTokenNode(json.kind, json.text).updateFromJSON(json);
  }

  exportJSON(): SerializedMarkdownTokenNode {
    return { ...super.exportJSON(), kind: this.__kind };
  }
}

export function $createMarkdownTokenNode(kind: MarkKind, text: string) {
  return $applyNodeReplacement(new MarkdownTokenNode(kind, text));
}

export function $isMarkdownTokenNode(
  node: LexicalNode | null | undefined,
): node is MarkdownTokenNode {
  return node instanceof MarkdownTokenNode;
}

/** What an emoji node shows: its image, or its shortcode until that loads. */
function EditorEmoji({ source }: { source: string }) {
  const custom = parseEmoji(source);
  const customEmoji = useCustomEmojiById(custom?.id ?? '');
  const set = useEmojiSet();
  const [failed, setFailed] = useState<string>();

  let label: string;
  let url: string | undefined;
  if (custom) {
    label = `:${customEmoji?.name ?? custom.name}:`;
    url = customEmoji?.url;
  } else {
    label = source;
    const entry = set?.byId.get(source.slice(1, -1));
    url = entry && emojiImageUrl(entry);
  }

  if (!url || failed === url) {
    return <span className={styles.emojiText}>{label}</span>;
  }
  return (
    <img
      className={styles.emojiImage}
      src={url}
      alt={label}
      title={label}
      draggable={false}
      onError={() => setFailed(url)}
    />
  );
}

export type SerializedEmojiNode = Spread<
  { source: string },
  SerializedLexicalNode
>;

/**
 * An emoji in the composer: a standard `:shortcode:` or a custom
 * `<emoji:ID:name>`, shown as its image and edited as one character.
 */
export class EmojiNode extends DecoratorNode<ReactNode> {
  __source: string;

  static getType(): string {
    return 'md-emoji';
  }

  static clone(node: EmojiNode): EmojiNode {
    return new EmojiNode(node.__source, node.__key);
  }

  constructor(source: string, key?: NodeKey) {
    super(key);
    this.__source = source;
  }

  getSource(): string {
    return this.getLatest().__source;
  }

  getTextContent(): string {
    return this.getLatest().__source;
  }

  createDOM(): HTMLElement {
    const span = document.createElement('span');
    span.className = styles.emojiNode ?? '';
    return span;
  }

  updateDOM(): false {
    return false;
  }

  /** Copied as HTML, it's the markdown it stands for. */
  exportDOM(): DOMExportOutput {
    const span = document.createElement('span');
    span.textContent = this.__source;
    return { element: span };
  }

  isInline(): true {
    return true;
  }

  /** Arrow keys step over it like a character instead of selecting it. */
  isKeyboardSelectable(): false {
    return false;
  }

  decorate(): ReactNode {
    return <EditorEmoji source={this.__source} />;
  }

  static importJSON(json: SerializedEmojiNode): EmojiNode {
    return $createEmojiNode(json.source).updateFromJSON(json);
  }

  exportJSON(): SerializedEmojiNode {
    return { ...super.exportJSON(), source: this.__source };
  }
}

export function $createEmojiNode(source: string) {
  return $applyNodeReplacement(new EmojiNode(source));
}

export function $isEmojiNode(
  node: LexicalNode | null | undefined,
): node is EmojiNode {
  return node instanceof EmojiNode;
}

export const MESSAGE_EDITOR_NODES = [MarkdownTokenNode, EmojiNode];
