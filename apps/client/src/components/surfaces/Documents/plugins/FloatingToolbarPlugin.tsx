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
import {
  Bold,
  Code,
  Italic,
  Link,
  type LucideIcon,
  Strikethrough,
  Underline,
} from 'lucide-react';
import {
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';

import { cx } from '@/design';

import styles from './plugins.module.css';

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

function ToolButton({
  icon: Icon,
  label,
  active,
  onPress,
}: {
  icon: LucideIcon;
  label: string;
  active: boolean;
  onPress: () => void;
}): ReactNode {
  return (
    <button
      type="button"
      className={styles.toolButton}
      aria-label={label}
      aria-pressed={active}
      title={label}
      // mousedown + preventDefault keeps the editor selection intact
      onMouseDown={(e) => {
        e.preventDefault();
        onPress();
      }}
    >
      <Icon size={15} strokeWidth={2.25} aria-hidden />
    </button>
  );
}

function FloatingToolbar({
  editor,
}: {
  editor: ReturnType<typeof useLexicalComposerContext>[0];
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
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const onMouseUp = () => {
      timeoutId = setTimeout(updateToolbar, 0);
    };
    document.addEventListener('mouseup', onMouseUp);
    return () => {
      document.removeEventListener('mouseup', onMouseUp);
      if (timeoutId !== null) clearTimeout(timeoutId);
    };
  }, [updateToolbar]);

  const toggleLink = useCallback(() => {
    if (isLink) {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
    } else {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, 'https://');
    }
  }, [editor, isLink]);

  const format = (
    f: 'bold' | 'italic' | 'underline' | 'strikethrough' | 'code',
  ) => editor.dispatchCommand(FORMAT_TEXT_COMMAND, f);

  return createPortal(
    <div
      ref={toolbarRef}
      role="toolbar"
      aria-label="Text formatting"
      aria-hidden={!isVisible}
      className={cx(styles.toolbar, isVisible && styles.visible)}
    >
      <ToolButton
        icon={Bold}
        label="Bold (Ctrl+B)"
        active={isBold}
        onPress={() => format('bold')}
      />
      <ToolButton
        icon={Italic}
        label="Italic (Ctrl+I)"
        active={isItalic}
        onPress={() => format('italic')}
      />
      <ToolButton
        icon={Underline}
        label="Underline (Ctrl+U)"
        active={isUnderline}
        onPress={() => format('underline')}
      />
      <ToolButton
        icon={Strikethrough}
        label="Strikethrough"
        active={isStrikethrough}
        onPress={() => format('strikethrough')}
      />
      <div className={styles.divider} aria-hidden />
      <ToolButton
        icon={Code}
        label="Inline code"
        active={isCode}
        onPress={() => format('code')}
      />
      <ToolButton
        icon={Link}
        label={isLink ? 'Remove link' : 'Add link'}
        active={isLink}
        onPress={toggleLink}
      />
    </div>,
    document.body,
  );
}

export function FloatingToolbarPlugin() {
  const [editor] = useLexicalComposerContext();

  return <FloatingToolbar editor={editor} />;
}
