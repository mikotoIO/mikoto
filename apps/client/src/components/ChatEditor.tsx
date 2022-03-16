import Draft, {
  Editor, EditorState, Modifier, RichUtils,
} from 'draft-js';
import 'draft-js/dist/Draft.css';
import React from 'react';
import styled from 'styled-components';

// https://github.com/jpuri/draftjs-utils/blob/master/js/block.js
function removeSelectedBlocksStyle(editorState: EditorState) {
  const newContentState = RichUtils.tryToRemoveBlockStyle(editorState);
  if (newContentState) {
    return EditorState.push(editorState, newContentState, 'change-block-type');
  }
  return editorState;
}

// https://github.com/jpuri/draftjs-utils/blob/master/js/block.js
export function getResetEditorState(editorState: EditorState) {
  const blocks = editorState
    .getCurrentContent()
    .getBlockMap()
    .toList();
  const updatedSelection = editorState.getSelection()
    .merge({
      anchorKey: blocks.first()
        .get('key'),
      anchorOffset: 0,
      focusKey: blocks.last()
        .get('key'),
      focusOffset: blocks.last()
        .getLength(),
    });
  const newContentState = Modifier.removeRange(
    editorState.getCurrentContent(),
    updatedSelection,
    'forward',
  );

  const newState = EditorState.push(editorState, newContentState, 'remove-range');
  return removeSelectedBlocksStyle(newState);
}

const EditorWrapper = styled.div`
  box-sizing: border-box;
  font-size: 14px;
  background-color: ${(p) => p.theme.colors.N700};
  padding: 12px;
  margin: 16px;
  border-radius: 4px;
  word-wrap: break-word;
  overflow-x: hidden;

  .public-DraftEditorPlaceholder-root {
    color: white;
    opacity: 20%;
  }

  .public-DraftEditor-content {
    max-height: 200px;
    overflow: auto;
  }
`;

interface ChatEditorProps {
  onMessageSend: (message: string) => void;
}

export default function ChatEditor({ onMessageSend }: ChatEditorProps) {
  const [editorState, setEditorState] = React.useState(() => EditorState.createEmpty());

  return (
    <EditorWrapper>
      <Editor
        editorState={editorState}
        onChange={setEditorState}
        placeholder="Message #dank-channel"
        keyBindingFn={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) return 'send';
          return Draft.getDefaultKeyBinding(e);
        }}
        handlePastedText={(text) => {
          const newContent = Modifier.insertText(
            editorState.getCurrentContent(),
            editorState.getSelection(),
            text,
          );

          setEditorState(EditorState.push(
            editorState,
            newContent,
            'insert-characters',
          ));
          return 'handled';
        }}
        handleKeyCommand={(cmd) => {
          if (cmd === 'send') {
            const text = editorState.getCurrentContent()
              .getPlainText().trim();
            if (text === '') return 'not-handled';
            onMessageSend(text);
            setEditorState(getResetEditorState(editorState));

            return 'handled';
          }
          return 'not-handled';
        }}
      />
    </EditorWrapper>
  );
}
