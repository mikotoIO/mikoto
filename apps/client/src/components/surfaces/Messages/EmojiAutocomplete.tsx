import styled from '@emotion/styled';
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
import { useCallback, useEffect, useRef, useState } from 'react';

const Overlay = styled.div`
  position: absolute;
  bottom: 100%;
  left: 0;
  background-color: var(--chakra-colors-gray-800);
  border: 1px solid var(--chakra-colors-gray-600);
  border-radius: 8px;
  padding: 4px;
  max-height: 240px;
  overflow-y: auto;
  width: 320px;
  z-index: 10;
  margin-bottom: 4px;
`;

const EmojiItem = styled.div<{ active: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  background-color: ${(p) =>
    p.active ? 'var(--chakra-colors-gray-600)' : 'transparent'};

  &:hover {
    background-color: var(--chakra-colors-gray-600);
  }
`;

const Native = styled.span`
  font-size: 18px;
  width: 24px;
  text-align: center;
  flex-shrink: 0;
`;

const Shortcode = styled.span`
  color: var(--chakra-colors-gray-400);
  font-size: 12px;
  margin-left: auto;
`;

const Name = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

type EmojiEntry = {
  id: string;
  name: string;
  native: string;
  keywords: string[];
};

let emojiListCache: EmojiEntry[] | null = null;
let loadingPromise: Promise<EmojiEntry[]> | null = null;

function loadEmojis(): Promise<EmojiEntry[]> {
  if (emojiListCache) return Promise.resolve(emojiListCache);
  if (!loadingPromise) {
    loadingPromise = import('@emoji-mart/data/sets/14/twitter.json').then(
      (mod) => {
        const data: any = (mod as any).default ?? mod;
        const list: EmojiEntry[] = Object.values<any>(data.emojis).map((e) => ({
          id: e.id,
          name: e.name,
          native: e.skins?.[0]?.native ?? '',
          keywords: e.keywords ?? [],
        }));
        emojiListCache = list;
        return list;
      },
    );
  }
  return loadingPromise;
}

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

function filterEmojis(emojis: EmojiEntry[], search: string): EmojiEntry[] {
  const q = search.toLowerCase();
  const startsWith: EmojiEntry[] = [];
  const idIncludes: EmojiEntry[] = [];
  const keywordIncludes: EmojiEntry[] = [];
  for (const e of emojis) {
    if (e.id.startsWith(q)) {
      startsWith.push(e);
    } else if (e.id.includes(q)) {
      idIncludes.push(e);
    } else if (e.keywords.some((k) => k.includes(q))) {
      keywordIncludes.push(e);
    }
    if (startsWith.length >= 10) break;
  }
  return [...startsWith, ...idIncludes, ...keywordIncludes].slice(0, 10);
}

export function EmojiAutocompletePlugin() {
  const [editor] = useLexicalComposerContext();
  const [emojis, setEmojis] = useState<EmojiEntry[]>([]);
  const [match, setMatch] = useState<EmojiMatch | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const activeIndexRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    loadEmojis().then((list) => {
      if (!cancelled) setEmojis(list);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = match ? filterEmojis(emojis, match.search) : [];
  const isOpen = match !== null && filtered.length > 0;

  activeIndexRef.current = activeIndex;

  useEffect(() => {
    setActiveIndex(0);
  }, [match?.search]);

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
    <Overlay
      onMouseDown={(e) => {
        e.preventDefault();
      }}
    >
      {filtered.map((emoji, i) => (
        <EmojiItem
          key={emoji.id}
          active={i === activeIndex}
          onClick={() => insertEmoji(emoji)}
        >
          <Native>{emoji.native}</Native>
          <Name>{emoji.name}</Name>
          <Shortcode>:{emoji.id}:</Shortcode>
        </EmojiItem>
      ))}
    </Overlay>
  );
}
