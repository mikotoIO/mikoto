import { faBold, faItalic, faStrikethrough } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { BubbleMenu, Editor } from "@tiptap/react";
import styled from "styled-components";

const BubbleMenuContainer = styled.div`
  background-color: var(--N1100);
  border: 1px solid var(--N600);
  padding: 4px;
  border-radius: 4px;

  button {
    background: none;
    border: none;
    color: var(--N400);
    font-size: 16px;

    &:hover {
      color: var(--N0);
    }
  }
`;

export function NoteBubbleMenu({ editor }: { editor: Editor }) {
  return (
    <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }}>
      <BubbleMenuContainer>
        <button
          type="button"
          onClick={() => {
            editor.chain().focus().toggleMark('bold').run();
          }}
        >
          <FontAwesomeIcon icon={faBold} />
        </button>
        <button
          type="button"
          onClick={() => {
            editor.chain().focus().toggleMark('italic').run();
          }}
        >
          <FontAwesomeIcon icon={faItalic} />
        </button>
        <button
          type="button"
          onClick={() => {
            editor.chain().focus().toggleMark('strike').run();
          }}
        >
          <FontAwesomeIcon icon={faStrikethrough} />
        </button>
      </BubbleMenuContainer>
    </BubbleMenu>
  );
}
