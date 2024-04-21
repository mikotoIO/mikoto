import { HocuspocusProvider } from '@hocuspocus/provider';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import TaskItem from '@tiptap/extension-task-item';
import TaskList from '@tiptap/extension-task-list';
import YouTube from '@tiptap/extension-youtube';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { ClientChannel } from 'mikotojs';
import { useEffect, useState } from 'react';
import { Markdown } from 'tiptap-markdown';
import * as Y from 'yjs';

import { env } from '@/env';

import { SlashCommand } from './SlashCommand';

const basicExtensions = [
  StarterKit.configure({
    history: false,
  }) as any,
  Link,
  Image,
  TaskList,
  TaskItem,
  Placeholder.configure({
    placeholder: () => "press '/' for commands",
    includeChildren: true,
  }),
  YouTube,
  Markdown.configure({
    html: false,
  }),
];

export interface UseNoteEditorProps {
  content: string;
  channel: ClientChannel;
  onChange?: () => void;
  cursorUser: { name: string; color: string };
}

export function useNoteEditor({
  content,
  channel,
  onChange,
  cursorUser,
}: UseNoteEditorProps) {
  const [synced, setSynced] = useState(false);
  const [ydoc] = useState(() => new Y.Doc());
  const [hocuspocusProvider] = useState(
    () =>
      new HocuspocusProvider({
        url: env.PUBLIC_COLLABORATION_URL,
        name: channel.id,
        document: ydoc,
      }),
  );

  const editor = useEditor({
    extensions: [
      ...basicExtensions,
      SlashCommand,
      Collaboration.configure({
        document: ydoc,
      }),
      CollaborationCursor.configure({
        provider: hocuspocusProvider,
        user: cursorUser,
      }),
    ],
    onUpdate() {
      onChange?.();
    },
    content: undefined,
  });

  useEffect(() => {
    if (!hocuspocusProvider) return;
    if (!editor) return;

    hocuspocusProvider.on('synced', () => {
      if (ydoc.store.clients.size === 0) {
        editor.commands.setContent(content);
      }
      setSynced(true);
    });
  }, [editor]);

  return { editor, synced };
}

export function useNoteReader(content: string) {
  const editor = useEditor({
    extensions: [...basicExtensions],
    editable: false,
    content,
  });

  return { editor };
}
