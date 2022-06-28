import { Editable, ReactEditor, Slate, withReact } from 'slate-react';
import { createEditor, Transforms, Node } from 'slate';
import { withHistory } from 'slate-history';
import { useMemo, useState } from 'react';
import styled from 'styled-components';

const SlateWrapper = styled.div``;

const StyledEditable = styled(Editable)`
  background-color: ${(p) => p.theme.colors.N700};
  margin: 16px;
  font-size: 14px;
  padding: 16px;
  border-radius: 4px;
`;

const initialEditorValue = [
  {
    children: [{ text: '' }],
  },
];

function resetEditor(editor: ReactEditor) {
  Transforms.setSelection(editor, {
    anchor: {
      path: [0, 0],
      offset: 0,
    },
    focus: {
      path: [0, 0],
      offset: 0,
    },
  });
  editor.children = [{ children: [{ text: '' }] }];
}

function serialize(nodes: Node[]) {
  return nodes.map((x) => Node.string(x)).join('\n');
}

interface MessageEditorProps {
  placeholder: string;
  onSubmit?: (content: string) => void;
}

export function MessageEditor({ placeholder, onSubmit }: MessageEditorProps) {
  const submitFn = onSubmit ?? (() => {});
  const editor = useMemo(
    () => withHistory(withReact(createEditor() as ReactEditor)),
    [],
  );
  const [editorValue, setEditorValue] = useState<Node[]>(initialEditorValue);
  // const [editor] = useState(() => withReact(createEditor() as ReactEditor));
  return (
    <SlateWrapper>
      <Slate
        editor={editor}
        value={editorValue}
        onChange={(x) => setEditorValue(x)}
      >
        <StyledEditable
          placeholder={placeholder}
          onKeyDown={(ev) => {
            if (ev.key === 'Enter' && !ev.shiftKey) {
              ev.preventDefault();
              submitFn(serialize(editorValue));
              setEditorValue(initialEditorValue);
              resetEditor(editor);
            }
          }}
        />
      </Slate>
    </SlateWrapper>
  );
}
