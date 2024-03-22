import { chakra } from '@chakra-ui/react';
import {
  faFaceSmileWink,
  faFileArrowUp,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import useResizeObserver from '@react-hook/resize-observer';
import { runInAction } from 'mobx';
import { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useSetRecoilState } from 'recoil';
import { Node, Transforms, createEditor } from 'slate';
import { withHistory } from 'slate-history';
import { Editable, ReactEditor, Slate, withReact } from 'slate-react';
import styled from '@emotion/styled';

import { contextMenuState } from '../ContextMenu';
import { MessageEditState } from './Message';

const EmojiPicker = lazy(() => import('./EmojiPicker'));

// TODO: Fix the two-pixel snap
const StyledEditable = styled(Editable)`
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
`;

const initialEditorValue = [{ children: [{ text: '' }] }];

function resetEditor(editor: ReactEditor, text: string = '') {
  Transforms.setSelection(editor, {
    anchor: { path: [0, 0], offset: 0 },
    focus: { path: [0, 0], offset: 0 },
  });
  editor.children = [{ children: [{ text }] }];
}

function serialize(nodes: Node[]) {
  return nodes.map((x) => Node.string(x)).join('\n');
}

// check if document.activeElement is either an input, textarea, or contenteditable
function isInputLike() {
  return (
    ['INPUT', 'TEXTAREA'].includes(document.activeElement?.nodeName ?? '') ||
    document.activeElement?.getAttribute('contenteditable') === 'true'
  );
}

interface MessageEditorProps {
  placeholder: string;
  editState: MessageEditState;
  onSubmit: (content: string, files: FileUpload[]) => void;
  onTyping?: () => void;
  onResize?: () => void;
}

const EditorButtons = styled.div`
  display: flex;
  position: absolute;
  gap: 16px;
  right: 16px;
  transform: translateY(-8px);
  font-size: 24px;
`;

const EditorButton = chakra('div', {
  baseStyle: {
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

const TopContainer = styled.div`
  margin: 16px 16px 4px;

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

const withFilePaste = (editor: ReactEditor, fileFn: (fs: FileList) => void) => {
  const { insertData } = editor;
  editor.insertData = (data) => {
    const { files } = data;
    fileFn(files);
    insertData(data);
  };
  return editor;
};

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

export function MessageEditor({
  placeholder,
  editState,
  onSubmit,
  onTyping,
  onResize,
}: MessageEditorProps) {
  const [editorValue, setEditorValue] = useState<Node[]>(() => [
    { children: [{ text: editState.message?.content ?? '' }] },
  ]);
  const [files, setFiles] = useState<FileUpload[]>([]);

  const fileFn = (fs: FileList) => {
    setFiles((xs) => [
      ...xs,
      ...Array.from(fs).map((file) => ({
        file,
        id: crypto.randomUUID(),
      })),
    ]);
  };

  const editor: ReactEditor = useMemo(
    () =>
      withFilePaste(
        withHistory(withReact(createEditor() as ReactEditor)),
        fileFn,
      ),
    [],
  );

  const setContextMenu = useSetRecoilState(contextMenuState);
  const ref = useRef<HTMLDivElement>(null);
  useResizeObserver(ref, () => {
    onResize?.();
  });

  useEffect(() => {
    ReactEditor.focus(editor);
    const fn = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape' && editState.message) {
        runInAction(() => {
          editState.message = null;
        });
        setEditorValue(initialEditorValue);
      }
      if (ev.ctrlKey || ev.altKey || ev.metaKey) return;
      if (ev.key.length !== 1) return;
      if (isInputLike()) return;
      ReactEditor.focus(editor);
      editor.insertText(ev.key);
      ev.preventDefault();
    };
    document.addEventListener('keydown', fn);

    return () => document.removeEventListener('keydown', fn);
  }, []);

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
    <TopContainer>
      {editState.message && <EditMode>Editing Message</EditMode>}
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
        <Slate
          editor={editor}
          initialValue={editorValue}
          onChange={(x) => setEditorValue(x)}
        >
          <StyledEditable
            placeholder={placeholder}
            onKeyDown={(ev) => {
              // submission
              if (ev.key !== 'Enter' || ev.shiftKey) {
                onTyping?.();
                return;
              }

              ev.preventDefault();

              // no empty message
              if (serialize(editorValue).trim() === '' && files.length === 0) {
                return;
              }

              const text = serialize(editorValue).trim();
              if (text.length === 0) return;

              // audio.play();

              onSubmit(text, files);
              setEditorValue(initialEditorValue);
              resetEditor(editor);
              setFiles([]);
            }}
          />
        </Slate>
        <EditorButtons>
          {editState.message === null && (
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
                        editor.insertText(x);
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
      </EditableContainer>
    </TopContainer>
  );
}
