import styled from '@emotion/styled';
import type { MikotoMember } from '@mikoto-io/mikoto.js';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { BaseRange } from 'slate';
import { Editor, Range, Transforms } from 'slate';
import { ReactEditor } from 'slate-react';

import { Avatar } from '@/components/atoms/Avatar';

const Overlay = styled.div`
  position: absolute;
  bottom: 100%;
  left: 0;
  background-color: var(--chakra-colors-gray-800);
  border: 1px solid var(--chakra-colors-gray-600);
  border-radius: 8px;
  padding: 4px;
  max-height: 200px;
  overflow-y: auto;
  width: 260px;
  z-index: 10;
  margin-bottom: 4px;
`;

const MentionItem = styled.div<{ active: boolean }>`
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

const Handle = styled.span`
  color: var(--chakra-colors-gray-400);
  font-size: 12px;
`;

function getMentionSearch(
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
  const atIndex = beforeText.lastIndexOf('@');
  if (atIndex === -1) return null;

  // @ must be at start or preceded by whitespace
  if (atIndex > 0 && !/\s/.test(beforeText[atIndex - 1])) return null;

  const search = beforeText.slice(atIndex + 1);
  // Don't show autocomplete if there's a space after partial mention
  if (search.includes(' ')) return null;

  const range = {
    anchor: { path: start.path, offset: atIndex },
    focus: start,
  };

  return { search, range };
}

function filterMembers(members: MikotoMember[], search: string) {
  const q = search.toLowerCase();
  return members
    .filter((m) => {
      const handle = m.user.handle?.toLowerCase() ?? '';
      const name = m.user.name.toLowerCase();
      return handle.includes(q) || name.includes(q);
    })
    .slice(0, 10);
}

interface UseMentionAutocompleteOptions {
  editor: Editor & ReactEditor;
  members: MikotoMember[];
}

export function useMentionAutocomplete({
  editor,
  members,
}: UseMentionAutocompleteOptions) {
  const [mentionState, setMentionState] = useState<{
    search: string;
    range: BaseRange;
  } | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const activeIndexRef = useRef(0);

  const filtered = mentionState
    ? filterMembers(members, mentionState.search)
    : [];
  const isOpen = mentionState !== null && filtered.length > 0;

  // Keep ref in sync
  activeIndexRef.current = activeIndex;

  // Reset index when search changes
  useEffect(() => {
    setActiveIndex(0);
  }, [mentionState?.search]);

  const updateMentionState = useCallback(() => {
    try {
      const result = getMentionSearch(editor);
      setMentionState(result);
    } catch {
      setMentionState(null);
    }
  }, [editor]);

  // Track editor changes via DOM observation
  useEffect(() => {
    let editorEl: HTMLElement;
    try {
      editorEl = ReactEditor.toDOMNode(editor, editor);
    } catch {
      return;
    }

    const observer = new MutationObserver(updateMentionState);
    observer.observe(editorEl, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    document.addEventListener('selectionchange', updateMentionState);

    return () => {
      observer.disconnect();
      document.removeEventListener('selectionchange', updateMentionState);
    };
  }, [editor, updateMentionState]);

  const insertMention = useCallback(
    (member: MikotoMember) => {
      if (!mentionState) return;
      const handle = member.user.handle ?? member.user.name;
      Transforms.select(editor, mentionState.range);
      Transforms.insertText(editor, `@${handle} `);
      setMentionState(null);
    },
    [editor, mentionState],
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
        const member = filtered[activeIndexRef.current];
        if (member) insertMention(member);
        return true;
      }
      if (ev.key === 'Escape') {
        ev.preventDefault();
        setMentionState(null);
        return true;
      }
      return false;
    },
    [isOpen, filtered, insertMention],
  );

  const overlay = isOpen ? (
    <Overlay
      onMouseDown={(e) => {
        e.preventDefault();
      }}
    >
      {filtered.map((member, i) => (
        <MentionItem
          key={member.userId}
          active={i === activeIndex}
          onClick={() => insertMention(member)}
        >
          <Avatar src={member.user.avatar} userId={member.userId} size={24} />
          <span>{member.name ?? member.user.name}</span>
          {member.user.handle && <Handle>@{member.user.handle}</Handle>}
        </MentionItem>
      ))}
    </Overlay>
  ) : null;

  return { overlay, onKeyDown };
}
