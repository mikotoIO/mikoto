import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $createRangeSelection,
  $getSelection,
  $insertNodes,
  $isRangeSelection,
  $setSelection,
  COMMAND_PRIORITY_HIGH,
  DROP_COMMAND,
  LexicalEditor,
  PASTE_COMMAND,
} from 'lexical';
import { useEffect } from 'react';

import { uploadFile } from '@/functions/fileUpload';

import { $createImageNode } from '../nodes/ImageNode';

function extractImageFiles(items: FileList | null | undefined): File[] {
  if (!items) return [];
  const files: File[] = [];
  for (const file of items) {
    if (file.type.startsWith('image/')) files.push(file);
  }
  return files;
}

async function uploadAndInsert(
  editor: LexicalEditor,
  files: File[],
  placeSelection: (() => void) | null,
) {
  const uploads = await Promise.all(
    files.map(async (file) => {
      const response = await uploadFile('/attachment', file);
      return { url: response.data.url, name: file.name };
    }),
  );

  editor.update(() => {
    if (placeSelection) placeSelection();
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) return;
    const nodes = uploads.map(({ url, name }) => $createImageNode(url, name));
    $insertNodes(nodes);
  });
}

function selectionFromPoint(clientX: number, clientY: number): (() => void) | null {
  // Use the DOM caret-from-point APIs to translate the drop coordinates into
  // a Lexical range so the image lands exactly where the user dropped it
  // rather than at the previous caret position.
  let domRange: Range | null = null;
  const docWithCaretPosition = document as Document & {
    caretPositionFromPoint?: (x: number, y: number) => { offsetNode: Node; offset: number } | null;
  };
  if (typeof docWithCaretPosition.caretPositionFromPoint === 'function') {
    const pos = docWithCaretPosition.caretPositionFromPoint(clientX, clientY);
    if (pos) {
      domRange = document.createRange();
      domRange.setStart(pos.offsetNode, pos.offset);
      domRange.collapse(true);
    }
  } else if (typeof document.caretRangeFromPoint === 'function') {
    domRange = document.caretRangeFromPoint(clientX, clientY);
  }
  if (!domRange) return null;

  return () => {
    const selection = $createRangeSelection();
    selection.applyDOMRange(domRange);
    $setSelection(selection);
  };
}

export function ImageUploadPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const unregisterDrop = editor.registerCommand(
      DROP_COMMAND,
      (event: DragEvent) => {
        const files = extractImageFiles(event.dataTransfer?.files);
        if (files.length === 0) return false;

        event.preventDefault();
        const placeSelection = selectionFromPoint(event.clientX, event.clientY);
        void uploadAndInsert(editor, files, placeSelection);
        return true;
      },
      COMMAND_PRIORITY_HIGH,
    );

    const unregisterPaste = editor.registerCommand(
      PASTE_COMMAND,
      (event: ClipboardEvent) => {
        const files = extractImageFiles(event.clipboardData?.files);
        if (files.length === 0) return false;

        event.preventDefault();
        void uploadAndInsert(editor, files, null);
        return true;
      },
      COMMAND_PRIORITY_HIGH,
    );

    return () => {
      unregisterDrop();
      unregisterPaste();
    };
  }, [editor]);

  return null;
}
