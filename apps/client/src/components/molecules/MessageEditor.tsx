import emojiData from '@emoji-mart/data/sets/14/twitter.json';
import Picker from '@emoji-mart/react';
import {
  faFaceSmileWink,
  faFileArrowUp,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Flex } from '@mikoto-io/lucid';
import { init } from 'emoji-mart';
import { runInAction } from 'mobx';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useRecoilState, useSetRecoilState } from 'recoil';
import { createEditor, Transforms, Node } from 'slate';
import { withHistory } from 'slate-history';
import { Editable, ReactEditor, Slate, withReact } from 'slate-react';
import styled from 'styled-components';

import { contextMenuState } from '../ContextMenu';
import { MessageEditState, messageEditIdState } from './Message';

init({ data: emojiData });

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
    background: var(--B700);
  }
`;

const EditableContainer = styled.div`
  background-color: var(--N700);
  padding: 16px 16px 4px;
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
}

const EditorButtons = styled(Flex)`
  transform: translateY(-8px);
  font-size: 24px;
`;

const EditorButton = styled.div`
  color: var(--N400);
  cursor: pointer;

  &:hover {
    color: var(--N200);
  }
`;

const EditMode = styled.div`
  background-color: var(--N1000);
  height: 32px;
  font-size: 14px;
  display: flex;
  align-items: center;
  padding-left: 16px;
`;

const TopContainer = styled.div`
  margin: 16px 16px 4px;

  & > *:first-child {
    border-top-left-radius: 4px;
    border-top-right-radius: 4px;
  }

  & > *:last-child {
    border-bottom-left-radius: 4px;
    border-bottom-right-radius: 4px;
  }
`;

const UploadSection = styled.div`
  display: flex;
  padding: 8px;
  gap: 8px;
  background-color: var(--N700);
  border-bottom: 1px solid var(--N600);
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
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 120px;
  height: 120px;
  border-radius: 4px;
  background-color: var(--N900);

  .preview {
    max-width: 100px;
    max-height: 100px;
    border-radius: 4px;
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
      <div>{file.name}</div>
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
        <EditorButtons gap={16}>
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
                  <Picker
                    data={emojiData}
                    set="twitter"
                    noCountryFlags={false}
                    onEmojiSelect={(x: any) => {
                      editor.insertText(x.shortcodes);
                    }}
                  />
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
