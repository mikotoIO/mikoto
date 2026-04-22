import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getNodeByKey,
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
import { Resizable } from 're-resizable';
import { ReactNode, useCallback, useEffect, useState } from 'react';

import { normalizeMediaUrl } from '@/components/atoms/Avatar';

export type SerializedImageNode = Spread<
  {
    src: string;
    altText: string;
    width?: number;
  },
  SerializedLexicalNode
>;

const MIN_WIDTH = 80;

function ImageComponent({
  src,
  altText,
  width,
  nodeKey,
}: {
  src: string;
  altText: string;
  width: number | undefined;
  nodeKey: NodeKey;
}) {
  const [editor] = useLexicalComposerContext();
  const [isEditable, setIsEditable] = useState(editor.isEditable());

  useEffect(() => editor.registerEditableListener(setIsEditable), [editor]);

  const commitWidth = useCallback(
    (nextWidth: number) => {
      editor.update(() => {
        const node = $getNodeByKey(nodeKey);
        if ($isImageNode(node)) node.setWidth(nextWidth);
      });
    },
    [editor, nodeKey],
  );

  const img = (
    <img
      src={normalizeMediaUrl(src)}
      alt={altText}
      className="editor-image"
      draggable={false}
      style={{
        display: 'block',
        borderRadius: '6px',
        width: width ? '100%' : 'auto',
        height: 'auto',
        maxWidth: '100%',
        maxHeight: width ? undefined : '60vh',
      }}
    />
  );

  if (!isEditable) {
    return (
      <span
        style={{
          display: 'inline-block',
          maxWidth: '100%',
          width: width ?? 'auto',
        }}
      >
        {img}
      </span>
    );
  }

  return (
    <Resizable
      size={{ width: width ?? 'auto', height: 'auto' }}
      lockAspectRatio
      minWidth={MIN_WIDTH}
      maxWidth="100%"
      enable={{
        top: false,
        left: false,
        bottom: false,
        topLeft: false,
        topRight: false,
        bottomLeft: false,
        right: true,
        bottomRight: true,
      }}
      handleStyles={{
        right: {
          width: 6,
          right: 0,
          cursor: 'ew-resize',
        },
        bottomRight: {
          width: 12,
          height: 12,
          right: 0,
          bottom: 0,
          cursor: 'nwse-resize',
        },
      }}
      onResizeStop={(_e, _direction, ref) => {
        commitWidth(ref.offsetWidth);
      }}
      style={{ display: 'inline-block', maxWidth: '100%' }}
    >
      {img}
    </Resizable>
  );
}

export class ImageNode extends DecoratorNode<ReactNode> {
  __src: string;
  __altText: string;
  __width: number | undefined;

  static getType(): string {
    return 'image';
  }

  static clone(node: ImageNode): ImageNode {
    return new ImageNode(node.__src, node.__altText, node.__width, node.__key);
  }

  constructor(
    src: string,
    altText: string,
    width?: number,
    key?: NodeKey,
  ) {
    super(key);
    this.__src = src;
    this.__altText = altText;
    this.__width = width;
  }

  static importJSON(serializedNode: SerializedImageNode): ImageNode {
    return $createImageNode(
      serializedNode.src,
      serializedNode.altText,
      serializedNode.width,
    );
  }

  exportJSON(): SerializedImageNode {
    return {
      type: 'image',
      version: 1,
      src: this.__src,
      altText: this.__altText,
      width: this.__width,
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
    if (this.__width) element.setAttribute('width', String(this.__width));
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

  getWidth(): number | undefined {
    return this.__width;
  }

  setWidth(width: number | undefined): void {
    const writable = this.getWritable();
    writable.__width = width;
  }

  decorate(_editor: LexicalEditor, _config: EditorConfig): ReactNode {
    return (
      <ImageComponent
        src={this.__src}
        altText={this.__altText}
        width={this.__width}
        nodeKey={this.__key}
      />
    );
  }
}

function convertImageElement(domNode: Node): null | DOMConversionOutput {
  if (!(domNode instanceof HTMLImageElement)) return null;
  const { src, alt, width } = domNode;
  if (!src) return null;
  const parsedWidth = Number.isFinite(width) && width > 0 ? width : undefined;
  return { node: $createImageNode(src, alt ?? '', parsedWidth) };
}

export function $createImageNode(
  src: string,
  altText = '',
  width?: number,
): ImageNode {
  return new ImageNode(src, altText, width);
}

export function $isImageNode(
  node: LexicalNode | null | undefined,
): node is ImageNode {
  return node instanceof ImageNode;
}
