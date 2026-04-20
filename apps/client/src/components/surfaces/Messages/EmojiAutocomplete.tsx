import styled from '@emotion/styled';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { BaseRange } from 'slate';
import { Editor, Range, Transforms } from 'slate';
import { ReactEditor } from 'slate-react';

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

function getEmojiSearch(
  editor: Editor,
): { search: string; range: BaseRange } | null {
  const { selection } = editor;
  if (!selection || !Range.isCollapsed(selection)) return null;

  const [start] = Range.edges(selection);
  const beforeRange = {
    anchor: { path: start.path, offset: 0 },
    focus: start,
  };

  const beforeText = Editor.string(editor, beforeRange);
  const colonIndex = beforeText.lastIndexOf(':');
  if (colonIndex === -1) return null;

  // : must be at start or preceded by whitespace
  if (colonIndex > 0 && !/\s/.test(beforeText[colonIndex - 1])) return null;

  const search = beforeText.slice(colonIndex + 1);
  // Only accept valid shortcode characters so smileys like ":D " or colons
  // used as punctuation don't keep the popup open.
  if (!/^[a-z0-9_+-]*$/i.test(search)) return null;
  // Require at least 2 chars to avoid opening on bare `:` or single letters.
  if (search.length < 2) return null;

  const range = {
    anchor: { path: start.path, offset: colonIndex },
    focus: start,
  };

  return { search, range };
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

interface UseEmojiAutocompleteOptions {
  editor: Editor & ReactEditor;
}

export function useEmojiAutocomplete({ editor }: UseEmojiAutocompleteOptions) {
  const [emojis, setEmojis] = useState<EmojiEntry[]>([]);
  const [emojiState, setEmojiState] = useState<{
    search: string;
    range: BaseRange;
  } | null>(null);
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

  const filtered = emojiState ? filterEmojis(emojis, emojiState.search) : [];
  const isOpen = emojiState !== null && filtered.length > 0;

  activeIndexRef.current = activeIndex;

  useEffect(() => {
    setActiveIndex(0);
  }, [emojiState?.search]);

  const updateEmojiState = useCallback(() => {
    try {
      const result = getEmojiSearch(editor);
      setEmojiState(result);
    } catch {
      setEmojiState(null);
    }
  }, [editor]);

  useEffect(() => {
    let editorEl: HTMLElement;
    try {
      editorEl = ReactEditor.toDOMNode(editor, editor);
    } catch {
      return;
    }

    const observer = new MutationObserver(updateEmojiState);
    observer.observe(editorEl, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    document.addEventListener('selectionchange', updateEmojiState);

    return () => {
      observer.disconnect();
      document.removeEventListener('selectionchange', updateEmojiState);
    };
  }, [editor, updateEmojiState]);

  const insertEmoji = useCallback(
    (emoji: EmojiEntry) => {
      if (!emojiState) return;
      Transforms.select(editor, emojiState.range);
      Transforms.insertText(editor, `:${emoji.id}: `);
      setEmojiState(null);
    },
    [editor, emojiState],
  );

  const onKeyDown = useCallback(
    (ev: React.KeyboardEvent): boolean => {
      if (!isOpen) return false;

      if (ev.key === 'ArrowUp') {
        ev.preventDefault();
        setActiveIndex((i) => (i <= 0 ? filtered.length - 1 : i - 1));
        return true;
      }
      if (ev.key === 'ArrowDown') {
        ev.preventDefault();
        setActiveIndex((i) => (i >= filtered.length - 1 ? 0 : i + 1));
        return true;
      }
      if (ev.key === 'Tab' || ev.key === 'Enter') {
        ev.preventDefault();
        const emoji = filtered[activeIndexRef.current];
        if (emoji) insertEmoji(emoji);
        return true;
      }
      if (ev.key === 'Escape') {
        ev.preventDefault();
        setEmojiState(null);
        return true;
      }
      return false;
    },
    [isOpen, filtered, insertEmoji],
  );

  const overlay = isOpen ? (
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
  ) : null;

  return { overlay, onKeyDown };
}
