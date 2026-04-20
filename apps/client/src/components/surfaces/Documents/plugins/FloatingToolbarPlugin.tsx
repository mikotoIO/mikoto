import styled from '@emotion/styled';
import {
  faBold,
  faCode,
  faItalic,
  faLink,
  faStrikethrough,
  faUnderline,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { $isLinkNode, TOGGLE_LINK_COMMAND } from '@lexical/link';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $isAtNodeEnd } from '@lexical/selection';
import { mergeRegister } from '@lexical/utils';
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_LOW,
  FORMAT_TEXT_COMMAND,
  SELECTION_CHANGE_COMMAND,
} from 'lexical';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

function getSelectedNode(selection: ReturnType<typeof $getSelection>) {
  if (!$isRangeSelection(selection)) return null;
  const anchor = selection.anchor;
  const focus = selection.focus;
  const anchorNode = anchor.getNode();
  const focusNode = focus.getNode();
  if (anchorNode === focusNode) return anchorNode;
  const isBackward = selection.isBackward();
  if (isBackward) {
    return $isAtNodeEnd(focus) ? anchorNode : focusNode;
  }
  return $isAtNodeEnd(anchor) ? focusNode : anchorNode;
}

const ToolbarContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 4px;
  background: var(--chakra-colors-gray-800);
  border: 1px solid var(--chakra-colors-gray-600);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  position: fixed;
  z-index: 100;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.15s ease;

  &.visible {
    opacity: 1;
    pointer-events: auto;
  }
`;

const ToolbarButton = styled.button<{ active?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: ${(p) =>
    p.active ? 'var(--chakra-colors-gray-600)' : 'transparent'};
  color: ${(p) =>
    p.active
      ? 'var(--chakra-colors-gray-50)'
      : 'var(--chakra-colors-gray-300)'};
  cursor: pointer;
  font-size: 13px;

  &:hover {
    background: var(--chakra-colors-gray-700);
    color: var(--chakra-colors-gray-50);
  }
`;

const Divider = styled.div`
  width: 1px;
  height: 20px;
  background: var(--chakra-colors-gray-600);
  margin: 0 2px;
`;

function FloatingToolbar({
  editor,
  anchorElem,
}: {
  editor: ReturnType<typeof useLexicalComposerContext>[0];
  anchorElem: HTMLElement;
}) {
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const [isCode, setIsCode] = useState(false);
  const [isLink, setIsLink] = useState(false);

  const updateToolbar = useCallback(() => {
    editor.getEditorState().read(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection) || selection.isCollapsed()) {
        setIsVisible(false);
        return;
      }

      setIsBold(selection.hasFormat('bold'));
      setIsItalic(selection.hasFormat('italic'));
      setIsUnderline(selection.hasFormat('underline'));
      setIsStrikethrough(selection.hasFormat('strikethrough'));
      setIsCode(selection.hasFormat('code'));

      const node = getSelectedNode(selection);
      const parent = node?.getParent();
      setIsLink($isLinkNode(parent) || $isLinkNode(node));

      // Position the toolbar
      const nativeSelection = window.getSelection();
      if (!nativeSelection || nativeSelection.rangeCount === 0) {
        setIsVisible(false);
        return;
      }

      const range = nativeSelection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      if (rect.width === 0 && rect.height === 0) {
        setIsVisible(false);
        return;
      }

      const toolbar = toolbarRef.current;
      if (!toolbar) return;

      const toolbarWidth = toolbar.offsetWidth;
      const toolbarHeight = toolbar.offsetHeight;

      const top = rect.top - toolbarHeight - 8;
      const left = rect.left + rect.width / 2 - toolbarWidth / 2;

      toolbar.style.top = `${Math.max(0, top)}px`;
      toolbar.style.left = `${Math.max(0, left)}px`;

      setIsVisible(true);
    });
  }, [editor]);

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          updateToolbar();
        });
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          updateToolbar();
          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
    );
  }, [editor, updateToolbar]);

  // Also update on mouse up to catch drag selections
  useEffect(() => {
    const onMouseUp = () => {
      setTimeout(updateToolbar, 0);
    };
    document.addEventListener('mouseup', onMouseUp);
    return () => document.removeEventListener('mouseup', onMouseUp);
  }, [updateToolbar]);

  const toggleLink = useCallback(() => {
    if (isLink) {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
    } else {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, 'https://');
    }
  }, [editor, isLink]);

  return createPortal(
    <ToolbarContainer ref={toolbarRef} className={isVisible ? 'visible' : ''}>
      <ToolbarButton
        active={isBold}
        onMouseDown={(e) => {
          e.preventDefault();
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold');
        }}
        title="Bold (Ctrl+B)"
      >
        <FontAwesomeIcon icon={faBold} />
      </ToolbarButton>
      <ToolbarButton
        active={isItalic}
        onMouseDown={(e) => {
          e.preventDefault();
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic');
        }}
        title="Italic (Ctrl+I)"
      >
        <FontAwesomeIcon icon={faItalic} />
      </ToolbarButton>
      <ToolbarButton
        active={isUnderline}
        onMouseDown={(e) => {
          e.preventDefault();
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline');
        }}
        title="Underline (Ctrl+U)"
      >
        <FontAwesomeIcon icon={faUnderline} />
      </ToolbarButton>
      <ToolbarButton
        active={isStrikethrough}
        onMouseDown={(e) => {
          e.preventDefault();
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough');
        }}
        title="Strikethrough"
      >
        <FontAwesomeIcon icon={faStrikethrough} />
      </ToolbarButton>
      <Divider />
      <ToolbarButton
        active={isCode}
        onMouseDown={(e) => {
          e.preventDefault();
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'code');
        }}
        title="Inline Code"
      >
        <FontAwesomeIcon icon={faCode} />
      </ToolbarButton>
      <ToolbarButton
        active={isLink}
        onMouseDown={(e) => {
          e.preventDefault();
          toggleLink();
        }}
        title="Link"
      >
        <FontAwesomeIcon icon={faLink} />
      </ToolbarButton>
    </ToolbarContainer>,
    document.body,
  );
}

export function FloatingToolbarPlugin() {
  const [editor] = useLexicalComposerContext();

  return <FloatingToolbar editor={editor} anchorElem={document.body} />;
}
