import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { PlainTextPlugin } from '@lexical/react/LexicalPlainTextPlugin';
import type { MikotoMember } from '@mikoto-io/mikoto.js';
import useResizeObserver from '@react-hook/resize-observer';
import { useAtomValue, useSetAtom } from 'jotai';
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_LOW,
  KEY_ENTER_COMMAND,
  type LexicalEditor,
  PASTE_COMMAND,
} from 'lexical';
import { ArrowUp, FileText, Paperclip, Smile, X } from 'lucide-react';
import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { useDropzone } from 'react-dropzone';

import { IconButton, Popover, PopoverTrigger } from '@/design';
import { useIsMobile } from '@/hooks/useIsMobile';

import { EmojiAutocompletePlugin } from './EmojiAutocomplete';
import { EmojiPickerPopover } from './EmojiPicker';
import { MentionAutocompletePlugin } from './MentionAutocomplete';
import { messageEditState } from './Message';
import styles from './MessageEditor.module.css';

// check if document.activeElement is either an input, textarea, or contenteditable
function isInputLike() {
  return (
    ['INPUT', 'TEXTAREA'].includes(document.activeElement?.nodeName ?? '') ||
    document.activeElement?.getAttribute('contenteditable') === 'true'
  );
}

export type FileUpload = {
  file: File;
  id: string;
};

interface MessageEditorProps {
  placeholder: string;
  onSubmit: (content: string, files: FileUpload[]) => void;
  onTyping?: () => void;
  onResize?: () => void;
  members?: MikotoMember[];
  /** Rendered on the line above the box (the typing indicator). */
  above?: ReactNode;
}

const PREVIEWABLE = ['image/gif', 'image/jpeg', 'image/png', 'image/webp'];

function FilePreview({
  file,
  onRemove,
}: {
  file: File;
  onRemove?: () => void;
}) {
  const isImage = PREVIEWABLE.includes(file.type);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Canonical "side-effect-produced value" pattern: create the blob URL on
  // mount/file-change, publish it via state, and revoke it on cleanup. The
  // setState-in-effect is intentional — there's no way to surface the URL
  // to the render tree without it.
  useEffect(() => {
    if (!isImage) return;
    const url = URL.createObjectURL(file);
    // eslint-disable-next-line @eslint-react/set-state-in-effect
    setPreviewUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file, isImage]);

  return (
    <div className={styles.file}>
      {isImage && previewUrl ? (
        <img className={styles.preview} src={previewUrl} alt="" />
      ) : (
        <FileText className={styles.fileIcon} size={28} aria-hidden />
      )}
      <span className={styles.fileName} title={file.name}>
        {file.name}
      </span>
      {onRemove && (
        <IconButton
          className={styles.remove}
          aria-label={`Remove ${file.name}`}
          onClick={onRemove}
        >
          <X size={14} />
        </IconButton>
      )}
    </div>
  );
}

interface MessageEditorHandle {
  insertText: (text: string) => void;
  focus: () => void;
  reset: () => void;
  getText: () => string;
}

function resetEditor(editor: LexicalEditor) {
  editor.update(() => {
    const root = $getRoot();
    root.clear();
    root.append($createParagraphNode());
  });
}

function FilePastePlugin({ onFiles }: { onFiles: (files: FileList) => void }) {
  const [editor] = useLexicalComposerContext();

  useEffect(
    () =>
      editor.registerCommand(
        PASTE_COMMAND,
        (event: ClipboardEvent) => {
          const files = event.clipboardData?.files;
          if (!files || files.length === 0) return false;
          onFiles(files);
          // Let other paste handlers still run (e.g. text paste alongside files)
          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
    [editor, onFiles],
  );

  return null;
}

function SubmitPlugin({
  onSubmit,
  onTyping,
  onEmptyChange,
  isMobile,
  suppressTypingRef,
}: {
  onSubmit: () => void;
  onTyping?: () => void;
  onEmptyChange: (empty: boolean) => void;
  isMobile: boolean;
  suppressTypingRef: React.RefObject<boolean>;
}) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (isMobile) return;
    return editor.registerCommand(
      KEY_ENTER_COMMAND,
      (event) => {
        if (event?.shiftKey) return false;
        event?.preventDefault();
        onSubmit();
        return true;
      },
      COMMAND_PRIORITY_LOW,
    );
  }, [editor, onSubmit, isMobile]);

  useEffect(() => {
    return editor.registerUpdateListener(
      ({ editorState, dirtyElements, dirtyLeaves }) => {
        onEmptyChange(
          editorState.read(() => $getRoot().getTextContent().trim() === ''),
        );
        if (suppressTypingRef.current) return;
        if (dirtyElements.size > 0 || dirtyLeaves.size > 0) {
          onTyping?.();
        }
      },
    );
  }, [editor, onTyping, onEmptyChange, suppressTypingRef]);

  return null;
}

function EditorApiPlugin({
  apiRef,
}: {
  apiRef: React.RefObject<MessageEditorHandle | null>;
}) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    apiRef.current = {
      insertText: (text) => {
        editor.focus();
        editor.update(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            selection.insertText(text);
            return;
          }
          const root = $getRoot();
          const last = root.getLastDescendant();
          if (last) {
            last.selectEnd();
            const sel = $getSelection();
            if ($isRangeSelection(sel)) sel.insertText(text);
          }
        });
      },
      focus: () => editor.focus(),
      reset: () => resetEditor(editor),
      getText: () =>
        editor.getEditorState().read(() => $getRoot().getTextContent()),
    };
    return () => {
      apiRef.current = null;
    };
  }, [editor, apiRef]);

  return null;
}

function initialEditorState(initialText: string) {
  return () => {
    const root = $getRoot();
    if (root.getFirstChild() !== null) return;
    const paragraph = $createParagraphNode();
    if (initialText) paragraph.append($createTextNode(initialText));
    root.append(paragraph);
  };
}

export function MessageEditor({
  placeholder,
  onSubmit,
  onTyping,
  onResize,
  members = [],
  above,
}: MessageEditorProps) {
  const currentEditState = useAtomValue(messageEditState);
  const setEditState = useSetAtom(messageEditState);
  const isMobile = useIsMobile();
  const [files, setFiles] = useState<FileUpload[]>([]);
  const [empty, setEmpty] = useState(!currentEditState?.content);
  const apiRef = useRef<MessageEditorHandle | null>(null);
  const suppressTypingRef = useRef(false);

  const addFiles = (fs: Iterable<File>) => {
    setFiles((xs) => [
      ...xs,
      ...Array.from(fs).map((file) => ({
        file,
        id: crypto.randomUUID(),
      })),
    ]);
  };

  const composerRef = useRef<HTMLDivElement>(null);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [editableEl, setEditableEl] = useState<HTMLDivElement | null>(null);
  useResizeObserver(editableEl, () => {
    onResize?.();
  });

  const initialConfig = useMemo(
    () => ({
      namespace: 'MessageEditor',
      editable: true,
      onError(error: Error) {
        throw error;
      },
      editorState: initialEditorState(currentEditState?.content ?? ''),
      theme: {
        paragraph: 'editor-paragraph',
        placeholder: 'editor-placeholder',
      },
    }),
    // Parent re-keys MessageEditor on edit-state change; capturing the
    // initial content once here is intentional.
    [],
  );

  const handleSubmit = () => {
    const text = (apiRef.current?.getText() ?? '').trim();
    if (text === '' && files.length === 0) return;
    onSubmit(text, files);
    suppressTypingRef.current = true;
    apiRef.current?.reset();
    suppressTypingRef.current = false;
    setFiles([]);
  };

  useEffect(() => {
    const fn = (ev: KeyboardEvent) => {
      if (ev.defaultPrevented) return;
      if (ev.key === 'Escape' && currentEditState) {
        setEditState(null);
        return;
      }
      if (isMobile) return;
      if (ev.ctrlKey || ev.altKey || ev.metaKey) return;
      if (ev.key.length !== 1) return;
      if (isInputLike()) return;
      apiRef.current?.focus();
      apiRef.current?.insertText(ev.key);
      ev.preventDefault();
    };
    document.addEventListener('keydown', fn);
    return () => document.removeEventListener('keydown', fn);
  }, [isMobile, currentEditState, setEditState]);

  // upload logic
  const dropzone = useDropzone({
    onDrop: addFiles,
  });

  const canSend = !empty || files.length > 0;

  return (
    <div className={styles.wrap}>
      {above}
      <div className={styles.composer} ref={composerRef}>
        <input {...dropzone.getInputProps()} />
        {currentEditState && (
          <div className={styles.editBar}>
            <b>Editing message</b>
            <span className={styles.editHint}>Esc to cancel</span>
            <button
              type="button"
              className={styles.linkButton}
              onClick={() => setEditState(null)}
            >
              Cancel
            </button>
          </div>
        )}
        {files.length !== 0 && (
          <div className={styles.uploads}>
            {files.map((fileUpload) => (
              <FilePreview
                file={fileUpload.file}
                key={fileUpload.id}
                onRemove={() => {
                  setFiles((xs) => xs.filter((x) => x.id !== fileUpload.id));
                }}
              />
            ))}
          </div>
        )}
        <div className={styles.editable} ref={setEditableEl}>
          <LexicalComposer initialConfig={initialConfig}>
            <PlainTextPlugin
              contentEditable={
                <ContentEditable
                  className={styles.input}
                  aria-label={placeholder}
                  aria-placeholder={placeholder}
                  placeholder={
                    <div className={styles.placeholder}>{placeholder}</div>
                  }
                />
              }
              ErrorBoundary={LexicalErrorBoundary}
            />
            <HistoryPlugin />
            <FilePastePlugin onFiles={addFiles} />
            <SubmitPlugin
              onSubmit={handleSubmit}
              onTyping={onTyping}
              onEmptyChange={setEmpty}
              isMobile={isMobile}
              suppressTypingRef={suppressTypingRef}
            />
            <MentionAutocompletePlugin members={members} />
            <EmojiAutocompletePlugin />
            <EditorApiPlugin apiRef={apiRef} />
            {!isMobile && <AutoFocusPlugin />}
          </LexicalComposer>
        </div>
        <div className={styles.bar}>
          {currentEditState === null && (
            <IconButton aria-label="Attach a file" onClick={dropzone.open}>
              <Paperclip size={16} />
            </IconButton>
          )}
          {!isMobile && (
            <Popover open={emojiOpen} onOpenChange={setEmojiOpen}>
              <PopoverTrigger
                render={
                  <IconButton aria-label="Emoji">
                    <Smile size={16} />
                  </IconButton>
                }
              />
              <EmojiPickerPopover
                anchor={composerRef}
                // Hand focus back to the text, not the trigger.
                finalFocus={() => {
                  apiRef.current?.focus();
                  return false;
                }}
                onPick={(emoji, keepOpen) => {
                  apiRef.current?.insertText(`:${emoji.id}:`);
                  if (!keepOpen) setEmojiOpen(false);
                }}
              />
            </Popover>
          )}
          {!isMobile && (
            <span className={styles.hint}>Shift+Enter for a new line</span>
          )}
          <span className={styles.grow} />
          <button
            type="button"
            className={styles.send}
            aria-label={currentEditState ? 'Save edit' : 'Send'}
            title={currentEditState ? 'Save edit' : 'Send'}
            disabled={!canSend}
            onClick={handleSubmit}
          >
            <ArrowUp size={16} aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}
