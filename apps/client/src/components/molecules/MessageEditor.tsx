import { useEffect, useMemo, useRef, useState } from 'react';
import { createEditor, Transforms, Node } from 'slate';
import { withHistory } from 'slate-history';
import { Editable, ReactEditor, Slate, withReact } from 'slate-react';
import styled from 'styled-components';

// TODO: Fix the two-pixel snap
const StyledEditable = styled(Editable)`
  background-color: ${(p) => p.theme.colors.N700};
  font-size: 14px;
  margin: 12px 16px 4px;
  padding: 16px;
  border-radius: 4px;
  box-sizing: border-box;
  outline: none;
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

interface MessageEditorProps {
  placeholder: string;
  onSubmit: (content: string) => void;
  onTyping?: () => void;
}

export function MessageEditor({
  placeholder,
  onSubmit,
  onTyping,
}: MessageEditorProps) {
  const editor = useMemo(
    () => withHistory(withReact(createEditor() as ReactEditor)),
    [],
  );
  const [editorValue, setEditorValue] = useState<Node[]>(initialEditorValue);

  useEffect(() => {
    ReactEditor.focus(editor);
    const fn = (ev: KeyboardEvent) => {
      // TODO: focus into the editor on text-producing keypress
    };
    document.addEventListener('keydown', fn);

    return () => document.removeEventListener('keydown', fn);
  }, []);

  return (
    <Slate
      editor={editor}
      initialValue={editorValue}
      onChange={(x) => setEditorValue(x)}
    >
      <StyledEditable
        onKeyDown={(ev) => {
          // submission
          if (ev.key !== 'Enter' || ev.shiftKey) {
            onTyping?.();
            return;
          }

          ev.preventDefault();
          const text = serialize(editorValue).trim();
          if (text.length === 0) return;

          onSubmit(text);
          setEditorValue(initialEditorValue);
          resetEditor(editor);
        }}
      />
    </Slate>
  );
}
