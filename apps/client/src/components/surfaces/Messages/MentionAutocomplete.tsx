import styled from '@emotion/styled';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import type { MikotoMember } from '@mikoto-io/mikoto.js';
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

interface MentionMatch {
  search: string;
  node: TextNode;
  startOffset: number;
  endOffset: number;
}

function readMentionSearch(editor: LexicalEditor): MentionMatch | null {
  let result: MentionMatch | null = null;
  editor.getEditorState().read(() => {
    const selection = $getSelection();
    if (!$isRangeSelection(selection) || !selection.isCollapsed()) return;
    const anchor = selection.anchor;
    const node = anchor.getNode();
    if (!$isTextNode(node)) return;

    const text = node.getTextContent();
    const beforeText = text.slice(0, anchor.offset);
    const atIndex = beforeText.lastIndexOf('@');
    if (atIndex === -1) return;

    // @ must be at start or preceded by whitespace
    if (atIndex > 0 && !/\s/.test(beforeText[atIndex - 1])) return;

    const search = beforeText.slice(atIndex + 1);
    // Don't show autocomplete if there's a space after partial mention
    if (search.includes(' ')) return;

    result = {
      search,
      node,
      startOffset: atIndex,
      endOffset: anchor.offset,
    };
  });
  return result;
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

interface MentionAutocompletePluginProps {
  members: MikotoMember[];
}

export function MentionAutocompletePlugin({
  members,
}: MentionAutocompletePluginProps) {
  const [editor] = useLexicalComposerContext();
  const [match, setMatch] = useState<MentionMatch | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const activeIndexRef = useRef(0);

  const filtered = match ? filterMembers(members, match.search) : [];
  const isOpen = match !== null && filtered.length > 0;

  activeIndexRef.current = activeIndex;

  useEffect(() => {
    setActiveIndex(0);
  }, [match?.search]);

  useEffect(() => {
    return editor.registerUpdateListener(() => {
      setMatch(readMentionSearch(editor));
    });
  }, [editor]);

  const insertMention = useCallback(
    (member: MikotoMember) => {
      const current = readMentionSearch(editor);
      if (!current) return;
      const handle = member.user.handle ?? member.user.name;
      editor.update(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) return;
        selection.setTextNodeRange(
          current.node,
          current.startOffset,
          current.node,
          current.endOffset,
        );
        selection.insertText(`@${handle} `);
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
      const member = filteredRef.current[activeIndexRef.current];
      if (member) insertMention(member);
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
  }, [editor, insertMention]);

  if (!isOpen) return null;

  return (
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
  );
}
