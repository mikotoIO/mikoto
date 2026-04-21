import {
  DecoratorNode,
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  EditorConfig,
  LexicalEditor,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  Spread,
} from 'lexical';
import { ReactNode } from 'react';

import { normalizeMediaUrl } from '@/components/atoms/Avatar';

export type SerializedImageNode = Spread<
  {
    src: string;
    altText: string;
  },
  SerializedLexicalNode
>;

function ImageComponent({ src, altText }: { src: string; altText: string }) {
  return (
    <img
      src={normalizeMediaUrl(src)}
      alt={altText}
      className="editor-image"
      draggable={false}
      style={{
        maxWidth: '100%',
        maxHeight: '60vh',
        borderRadius: '6px',
        display: 'block',
      }}
    />
  );
}

export class ImageNode extends DecoratorNode<ReactNode> {
  __src: string;
  __altText: string;

  static getType(): string {
    return 'image';
  }

  static clone(node: ImageNode): ImageNode {
    return new ImageNode(node.__src, node.__altText, node.__key);
  }

  constructor(src: string, altText: string, key?: NodeKey) {
    super(key);
    this.__src = src;
    this.__altText = altText;
  }

  static importJSON(serializedNode: SerializedImageNode): ImageNode {
    return $createImageNode(serializedNode.src, serializedNode.altText);
  }

  exportJSON(): SerializedImageNode {
    return {
      type: 'image',
      version: 1,
      src: this.__src,
      altText: this.__altText,
    };
  }

  static importDOM(): DOMConversionMap | null {
    return {
      img: () => ({
        conversion: convertImageElement,
        priority: 0,
      }),
    };
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('img');
    element.setAttribute('src', this.__src);
    element.setAttribute('alt', this.__altText);
    return { element };
  }

  createDOM(config: EditorConfig): HTMLElement {
    const span = document.createElement('span');
    const theme = config.theme as { image?: string };
    if (theme.image) span.className = theme.image;
    return span;
  }

  updateDOM(): false {
    return false;
  }

  getSrc(): string {
    return this.__src;
  }

  getAltText(): string {
    return this.__altText;
  }

  decorate(_editor: LexicalEditor, _config: EditorConfig): ReactNode {
    return <ImageComponent src={this.__src} altText={this.__altText} />;
  }
}

function convertImageElement(domNode: Node): null | DOMConversionOutput {
  if (!(domNode instanceof HTMLImageElement)) return null;
  const { src, alt } = domNode;
  if (!src) return null;
  return { node: $createImageNode(src, alt ?? '') };
}

export function $createImageNode(src: string, altText = ''): ImageNode {
  return new ImageNode(src, altText);
}

export function $isImageNode(
  node: LexicalNode | null | undefined,
): node is ImageNode {
  return node instanceof ImageNode;
}
