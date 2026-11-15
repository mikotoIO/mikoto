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

import { describeError, toast } from '@/design';
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
  // Upload independently so one failed image doesn't drop the others.
  const results = await Promise.allSettled(
    files.map(async (file) => {
      const response = await uploadFile('/attachment', file);
      return { url: response.data.url, name: file.name };
    }),
  );
  const uploads: { url: string; name: string }[] = [];
  results.forEach((result, i) => {
    if (result.status === 'fulfilled') {
      uploads.push(result.value);
    } else {
      toast({
        type: 'error',
        title: `Couldn't upload ${files[i].name}`,
        description: describeError(result.reason, { context: 'action' })
          .message,
      });
    }
  });
  if (uploads.length === 0) return;

  editor.update(() => {
    if (placeSelection) placeSelection();
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) return;
    const nodes = uploads.map(({ url, name }) => $createImageNode(url, name));
    $insertNodes(nodes);
  });
}

function selectionFromPoint(
  clientX: number,
  clientY: number,
): (() => void) | null {
  const pos = document.caretPositionFromPoint(clientX, clientY);
  if (!pos) return null;
  const domRange = document.createRange();
  domRange.setStart(pos.offsetNode, pos.offset);
  domRange.collapse(true);

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
