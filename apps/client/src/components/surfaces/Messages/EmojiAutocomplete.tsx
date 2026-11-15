import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  COMMAND_PRIORITY_CRITICAL,
  KEY_ARROW_DOWN_COMMAND,
  KEY_ARROW_UP_COMMAND,
  KEY_ENTER_COMMAND,
  KEY_ESCAPE_COMMAND,
  KEY_TAB_COMMAND,
  type LexicalEditor,
  type TextNode,
} from 'lexical';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useCustomEmojis } from '@/components/molecules/markdown';
import { cx } from '@/design';

import styles from './MessageEditor.module.css';
import {
  type EmojiEntry,
  customEmojiEntries,
  loadEmojis,
  searchEmojis,
} from './emojiData';

interface EmojiMatch {
  search: string;
  node: TextNode;
  startOffset: number;
  endOffset: number;
}

function readEmojiSearch(editor: LexicalEditor): EmojiMatch | null {
  let result: EmojiMatch | null = null;
  editor.getEditorState().read(() => {
    const selection = $getSelection();
    if (!$isRangeSelection(selection) || !selection.isCollapsed()) return;
    const anchor = selection.anchor;
    const node = anchor.getNode();
    if (!$isTextNode(node)) return;

    const text = node.getTextContent();
    const beforeText = text.slice(0, anchor.offset);
    const colonIndex = beforeText.lastIndexOf(':');
    if (colonIndex === -1) return;

    // : must be at start or preceded by whitespace
    if (colonIndex > 0 && !/\s/.test(beforeText[colonIndex - 1])) return;

    const search = beforeText.slice(colonIndex + 1);
    // Only accept valid shortcode characters so smileys like ":D " or colons
    // used as punctuation don't keep the popup open.
    if (!/^[a-z0-9_+-]*$/i.test(search)) return;
    // Require at least 2 chars to avoid opening on bare `:` or single letters.
    if (search.length < 2) return;

    result = {
      search,
      node,
      startOffset: colonIndex,
      endOffset: anchor.offset,
    };
  });
  return result;
}

export function EmojiAutocompletePlugin() {
  const [editor] = useLexicalComposerContext();
  const [emojis, setEmojis] = useState<EmojiEntry[]>([]);
  const [match, setMatch] = useState<EmojiMatch | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const activeIndexRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    loadEmojis().then((set) => {
      if (!cancelled) setEmojis(set.list);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const customSet = useCustomEmojis();
  // The space's own emoji rank ahead of standard ones with similar names.
  const all = useMemo(
    () => [...customEmojiEntries(customSet.list), ...emojis],
    [customSet.list, emojis],
  );
  const filtered = match ? searchEmojis(all, match.search, 10) : [];
  const isOpen = match !== null && filtered.length > 0;

  activeIndexRef.current = activeIndex;

  // Reset the active index when the search term changes. Done during render
  // via a tracked previous value so we don't double-commit in an effect.
  const [prevSearch, setPrevSearch] = useState(match?.search);
  if (prevSearch !== match?.search) {
    setPrevSearch(match?.search);
    setActiveIndex(0);
  }

  useEffect(() => {
    return editor.registerUpdateListener(() => {
      setMatch(readEmojiSearch(editor));
    });
  }, [editor]);

  const insertEmoji = useCallback(
    (emoji: EmojiEntry) => {
      const current = readEmojiSearch(editor);
      if (!current) return;
      editor.update(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) return;
        selection.setTextNodeRange(
          current.node,
          current.startOffset,
          current.node,
          current.endOffset,
        );
        selection.insertText(`:${emoji.id}: `);
      });
      setMatch(null);
    },
    [editor],
  );

  const filteredRef = useRef(filtered);
  filteredRef.current = filtered;
  const isOpenRef = useRef(isOpen);
  isOpenRef.current = isOpen;

  useEffect(() => {
    const moveSelection = (delta: number) => {
      const list = filteredRef.current;
      if (list.length === 0) return;
      setActiveIndex((i) => {
        const n = list.length;
        return (i + delta + n) % n;
      });
    };

    const unregisterUp = editor.registerCommand(
      KEY_ARROW_UP_COMMAND,
      (event) => {
        if (!isOpenRef.current) return false;
        event?.preventDefault();
        moveSelection(-1);
        return true;
      },
      COMMAND_PRIORITY_CRITICAL,
    );
    const unregisterDown = editor.registerCommand(
      KEY_ARROW_DOWN_COMMAND,
      (event) => {
        if (!isOpenRef.current) return false;
        event?.preventDefault();
        moveSelection(1);
        return true;
      },
      COMMAND_PRIORITY_CRITICAL,
    );
    const selectActive = (event: KeyboardEvent | null) => {
      if (!isOpenRef.current) return false;
      event?.preventDefault();
      const emoji = filteredRef.current[activeIndexRef.current];
      if (emoji) insertEmoji(emoji);
      return true;
    };
    const unregisterEnter = editor.registerCommand(
      KEY_ENTER_COMMAND,
      selectActive,
      COMMAND_PRIORITY_CRITICAL,
    );
    const unregisterTab = editor.registerCommand(
      KEY_TAB_COMMAND,
      selectActive,
      COMMAND_PRIORITY_CRITICAL,
    );
    const unregisterEscape = editor.registerCommand(
      KEY_ESCAPE_COMMAND,
      (event) => {
        if (!isOpenRef.current) return false;
        event?.preventDefault();
        setMatch(null);
        return true;
      },
      COMMAND_PRIORITY_CRITICAL,
    );

    return () => {
      unregisterUp();
      unregisterDown();
      unregisterEnter();
      unregisterTab();
      unregisterEscape();
    };
  }, [editor, insertEmoji]);

  if (!isOpen) return null;

  return (
    <div
      className={styles.popup}
      role="listbox"
      aria-label="Emoji"
      onMouseDown={(e) => {
        e.preventDefault();
      }}
    >
      {filtered.map((emoji, i) => (
        <div
          key={emoji.key}
          role="option"
          aria-selected={i === activeIndex}
          className={cx(styles.option, i === activeIndex && styles.active)}
          onClick={() => insertEmoji(emoji)}
        >
          {emoji.custom ? (
            <img
              className={styles.customEmoji}
              src={emoji.custom.url}
              alt=""
              draggable={false}
            />
          ) : (
            <span className={styles.native}>{emoji.native}</span>
          )}
          <span className={styles.optionName}>{emoji.name}</span>
          <span className={styles.optionMeta}>:{emoji.id}:</span>
        </div>
      ))}
    </div>
  );
}
