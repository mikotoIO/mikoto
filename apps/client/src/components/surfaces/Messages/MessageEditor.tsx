import { chakra } from '@chakra-ui/react';
import styled from '@emotion/styled';
import {
  faFaceSmileWink,
  faFileArrowUp,
  faPaperPlane,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
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
  PASTE_COMMAND,
  type LexicalEditor,
} from 'lexical';
import { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react';
import { useDropzone } from 'react-dropzone';

import { contextMenuState } from '@/components/ContextMenu';
import { useIsMobile } from '@/hooks/useIsMobile';

import { EmojiAutocompletePlugin } from './EmojiAutocomplete';
import { MentionAutocompletePlugin } from './MentionAutocomplete';
import { messageEditState } from './Message';

const EmojiPicker = lazy(() => import('./EmojiPicker'));

// TODO: Fix the two-pixel snap
const StyledContentEditable = styled(ContentEditable)`
  font-size: 14px;

  box-sizing: border-box;
  outline: none;
  word-break: break-word;
  min-height: auto !important;
  max-height: 300px;
  overflow-y: auto;
  flex-grow: 1;

  ::selection {
    background: var(--chakra-colors-blue-500);
  }
`;

const Placeholder = styled.div`
  position: absolute;
  top: 16px;
  left: 16px;
  color: var(--chakra-colors-gray-400);
  pointer-events: none;
  user-select: none;
  font-size: 14px;
`;

const EditableContainer = styled.div`
  background-color: color-mix(
    in srgb,
    var(--chakra-colors-gray-650) 65%,
    transparent
  );
  padding: 16px;
  padding-right: 80px;
  position: relative;
  display: flex;
  align-items: flex-end;
`;

// check if document.activeElement is either an input, textarea, or contenteditable
function isInputLike() {
  return (
    ['INPUT', 'TEXTAREA'].includes(document.activeElement?.nodeName ?? '') ||
    document.activeElement?.getAttribute('contenteditable') === 'true'
  );
}

interface MessageEditorProps {
  placeholder: string;
  onSubmit: (content: string, files: FileUpload[]) => void;
  onTyping?: () => void;
  onResize?: () => void;
  members?: MikotoMember[];
}

const EditorButtons = styled.div`
  display: flex;
  position: absolute;
  gap: 16px;
  right: 16px;
  transform: translateY(8px);
  font-size: 24px;
`;

const EditorButton = chakra('div', {
  base: {
    color: 'gray.400',
    cursor: 'pointer',
    _hover: {
      color: 'gray.200',
    },
  },
});

const EditMode = styled.div`
  background-color: var(--chakra-colors-gray-800);
  height: 32px;
  font-size: 14px;
  display: flex;
  align-items: center;
  padding-left: 16px;
`;

const EditorRow = styled.div`
  display: flex;
  align-items: center;
  margin: 16px 16px 4px;
  gap: 8px;
`;

const TopContainer = styled.div`
  border: 1px solid var(--chakra-colors-gray-600);
  border-radius: 8px;
  flex: 1;
  min-width: 0;

  & > *:first-of-type {
    border-top-left-radius: 8px;
    border-top-right-radius: 8px;
  }

  & > *:last-of-type {
    border-bottom-left-radius: 8px;
    border-bottom-right-radius: 8px;
  }
`;

const UploadSection = styled.div`
  display: flex;
  padding: 8px;
  gap: 8px;
  border-bottom: 1px solid var(--chakra-colors-gray-600);
  background-color: color-mix(
    in srgb,
    var(--chakra-colors-gray-650) 65%,
    transparent
  );
`;

const StyledFilePreview = styled.div`
  padding: 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 160px;
  height: 140px;
  border-radius: 4px;
  background-color: var(--chakra-colors-gray-800);
  overflow: hidden;

  .preview {
    max-width: 100px;
    max-height: 100px;
    border-radius: 4px;
  }

  .filename {
    margin-top: 8px;
    font-size: 12px;
    color: var(--chakra-colors-gray-300);
  }
`;

interface FilePreviewProps {
  file: File;
  onRemove?: () => void;
}

function FilePreview({ file, onRemove }: FilePreviewProps) {
  const isImage = ['image/gif', 'image/jpeg', 'image/png'].includes(file.type);
  return (
    <StyledFilePreview onClick={onRemove}>
      {isImage && (
        <img
          className="preview"
          src={URL.createObjectURL(file)}
          alt={file.name}
        />
      )}
      <div className="filename">{file.name}</div>
    </StyledFilePreview>
  );
}

type FileUpload = {
  file: File;
  id: string;
};

const SendButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border: none;
  border-radius: 4px;
  background-color: var(--chakra-colors-blue-600);
  color: white;
  cursor: pointer;
  flex-shrink: 0;
  font-size: 16px;
  &:active {
    background-color: var(--chakra-colors-blue-700);
  }
`;

export interface MessageEditorHandle {
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
  isMobile,
}: {
  onSubmit: () => void;
  onTyping?: () => void;
  isMobile: boolean;
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
    return editor.registerUpdateListener(({ dirtyElements, dirtyLeaves }) => {
      if (dirtyElements.size > 0 || dirtyLeaves.size > 0) {
        onTyping?.();
      }
    });
  }, [editor, onTyping]);

  return null;
}


function EditorApiPlugin({
  apiRef,
}: {
  apiRef: React.MutableRefObject<MessageEditorHandle | null>;
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
}: MessageEditorProps) {
  const currentEditState = useAtomValue(messageEditState);
  const setEditState = useSetAtom(messageEditState);
  const isMobile = useIsMobile();
  const [files, setFiles] = useState<FileUpload[]>([]);
  const apiRef = useRef<MessageEditorHandle | null>(null);

  const fileFn = (fs: FileList) => {
    setFiles((xs) => [
      ...xs,
      ...Array.from(fs).map((file) => ({
        file,
        id: crypto.randomUUID(),
      })),
    ]);
  };

  const setContextMenu = useSetAtom(contextMenuState);
  const ref = useRef<HTMLDivElement>(null);
  useResizeObserver(ref as React.RefObject<HTMLElement>, () => {
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
    apiRef.current?.reset();
    setFiles([]);
  };

  useEffect(() => {
    const fn = (ev: KeyboardEvent) => {
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
    onDrop: (fl) => {
      setFiles((xs) => [
        ...xs,
        ...fl.map((file) => ({
          file,
          id: crypto.randomUUID(),
        })),
      ]);
    },
  });

  return (
    <EditorRow>
      <TopContainer>
        <input {...dropzone.getInputProps()} />
        {currentEditState && <EditMode>Editing Message</EditMode>}
        {files.length !== 0 && (
          <UploadSection>
            {files.map((fileUpload) => (
              <FilePreview
                file={fileUpload.file}
                key={fileUpload.id}
                onRemove={() => {
                  setFiles((xs) => xs.filter((x) => x.id !== fileUpload.id));
                }}
              />
            ))}
          </UploadSection>
        )}
        <EditableContainer ref={ref}>
          <LexicalComposer initialConfig={initialConfig}>
            <PlainTextPlugin
              contentEditable={<StyledContentEditable />}
              placeholder={<Placeholder>{placeholder}</Placeholder>}
              ErrorBoundary={LexicalErrorBoundary}
            />
            <HistoryPlugin />
            <FilePastePlugin onFiles={fileFn} />
            <SubmitPlugin
              onSubmit={handleSubmit}
              onTyping={onTyping}
              isMobile={isMobile}
            />
            <MentionAutocompletePlugin members={members} />
            <EmojiAutocompletePlugin />
            <EditorApiPlugin apiRef={apiRef} />
            {!isMobile && <AutoFocusPlugin />}
          </LexicalComposer>
          {!isMobile && (
            <EditorButtons>
              {currentEditState === null && (
                <EditorButton
                  onClick={() => {
                    dropzone.open();
                  }}
                >
                  <FontAwesomeIcon icon={faFileArrowUp} />
                </EditorButton>
              )}
              <EditorButton
                onClick={(ev) => {
                  if (!ref.current) return;
                  const bounds = ref.current.getBoundingClientRect();
                  ev.preventDefault();
                  ev.stopPropagation();
                  setContextMenu({
                    elem: (
                      <Suspense>
                        <EmojiPicker
                          onEmojiSelect={(x) => {
                            apiRef.current?.insertText(x);
                          }}
                        />
                      </Suspense>
                    ),
                    position: {
                      right: window.innerWidth - bounds.right,
                      bottom: window.innerHeight - bounds.top + 16,
                    },
                  });
                }}
              >
                <FontAwesomeIcon icon={faFaceSmileWink} />
              </EditorButton>
            </EditorButtons>
          )}
        </EditableContainer>
      </TopContainer>
      {isMobile && (
        <SendButton onClick={handleSubmit}>
          <FontAwesomeIcon icon={faPaperPlane} />
        </SendButton>
      )}
    </EditorRow>
  );
}
