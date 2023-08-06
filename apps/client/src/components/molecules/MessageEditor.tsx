import { useEffect, useMemo, useState } from 'react';
import { createEditor, Transforms, Node } from 'slate';
import { withHistory } from 'slate-history';
import { Editable, ReactEditor, Slate, withReact } from 'slate-react';
import styled from 'styled-components';

// TODO: Fix the two-pixel snap
const StyledEditable = styled(Editable)`
  background-color: var(--N700);
  font-size: 14px;
  padding: 16px;
  border-radius: 4px;
  box-sizing: border-box;
  outline: none;
  word-break: break-word;
  min-height: auto !important;
  max-height: 300px;
  overflow-y: auto;

  ::selection {
    background: var(--B700);
  }
`;

const EditableContainer = styled.div`
  margin: 12px 16px 4px;
`;

const initialEditorValue = [{ children: [{ text: '' }] }];

function resetEditor(editor: ReactEditor) {
  Transforms.setSelection(editor, {
    anchor: { path: [0, 0], offset: 0 },
    focus: { path: [0, 0], offset: 0 },
  });
  editor.children = initialEditorValue;
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
  onSubmit: (content: string) => void;
  onTyping?: () => void;
}

const audio = new Audio('audio/notification/extralife.wav');

export function MessageEditor({
  placeholder,
  onSubmit,
  onTyping,
}: MessageEditorProps) {
  const editor: ReactEditor = useMemo(
    () => withHistory(withReact(createEditor() as ReactEditor)),
    [],
  );
  const [editorValue, setEditorValue] = useState<Node[]>(initialEditorValue);

  useEffect(() => {
    ReactEditor.focus(editor);
    const fn = (ev: KeyboardEvent) => {
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

  return (
    <EditableContainer>
      <Slate
        editor={editor}
        initialValue={editorValue}
        onChange={(x) => setEditorValue(x)}
      >
        <StyledEditable
          placeholder={placeholder}
          onKeyDown={(ev) => {
            if (serialize(editorValue).trim() === '') {
              return;
            }
            // submission
            if (ev.key !== 'Enter' || ev.shiftKey) {
              onTyping?.();
              return;
            }

            ev.preventDefault();
            const text = serialize(editorValue).trim();
            if (text.length === 0) return;

            // audio.play();

            onSubmit(text);
            setEditorValue(initialEditorValue);
            resetEditor(editor);
          }}
        />
      </Slate>
    </EditableContainer>
  );
}
