import {
  faBold,
  faFileLines,
  faItalic,
  faStrikethrough,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { HocuspocusProvider } from '@hocuspocus/provider';
import { Box, Flex, Heading } from '@mikoto-io/lucid';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import TaskItem from '@tiptap/extension-task-item';
import TaskList from '@tiptap/extension-task-list';
import YouTube from '@tiptap/extension-youtube';
import { BubbleMenu, Editor, EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { ClientChannel } from 'mikotojs';
import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Markdown } from 'tiptap-markdown';
import * as Y from 'yjs';

import { useInterval, useMikoto } from '../../../hooks';
import { TabName } from '../../TabBar';
import { ViewContainer } from '../../ViewContainer';
import { SlashCommand } from './SlashCommand';

const EditorContentWrapper = styled.div`
  .tiptap {
    outline: none;
  }
  a {
    color: var(--B400);
  }

  img {
    max-width: 400px;
    max-height: 400px;
  }

  ul[data-type='taskList'] {
    li {
      list-style: none;
    }
    input {
      margin-right: 8px;
      width: 16px;
      height: 16px;
      accent-color: var(--B700);
    }
    div,
    p {
      display: inline-block;
    }
    p {
      margin: 8px 0;
    }
    padding-left: 0;
  }

  p.is-empty::before {
    color: var(--N500);
    content: attr(data-placeholder);
    float: left;
    height: 0;
    pointer-events: none;
  }

  .collaboration-cursor__caret {
    border-left: 1px solid #0d0d0d;
    border-right: 1px solid #0d0d0d;
    margin-left: -1px;
    margin-right: -1px;
    pointer-events: none;
    position: relative;
    word-break: normal;
  }

  /* Render the username above the caret */
  .collaboration-cursor__label {
    border-radius: 3px 3px 3px 0;
    color: #0d0d0d;
    font-size: 12px;
    font-style: normal;
    font-weight: 600;
    left: -1px;
    line-height: normal;
    padding: 0.1rem 0.3rem;
    position: absolute;
    top: -1.4em;
    user-select: none;
    white-space: nowrap;
  }
`;

interface DocumentEditorProps {
  channel: ClientChannel;
  content: string;
  onChange?(): void;
}

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

function NoteBubbleMenu({ editor }: { editor: Editor }) {
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

function DocumentEditor({ channel, content, onChange }: DocumentEditorProps) {
  const [changed, setChanged] = useState(false);
  // const [ydoc] = useState(() => new Y.Doc());
  // const [provider] = useState(
  //   () =>
  //     new HocuspocusProvider({
  //       url: 'ws://localhost:1234',
  //       name: channel.id,
  //       document: ydoc,
  //     }),
  // );
  const mikoto = useMikoto();

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        history: false,
      }) as any,
      Link,
      Image,
      TaskList,
      TaskItem,
      SlashCommand,
      Placeholder.configure({
        placeholder: () => "press '/' for commands",
        includeChildren: true,
      }),
      YouTube,
      Markdown.configure({
        html: false,
      }),
      // Collaboration.configure({
      //   document: ydoc,
      // }),
      // CollaborationCursor.configure({
      //   provider,
      //   user: {
      //     name: 'unknown',
      //     color: '#00ffff',
      //   },
      // }),
    ],
    onUpdate() {
      onChange?.();
      setChanged(true);
    },
    content,
  });

  const save = (edt: Editor) => {
    const contentString: string = edt.storage.markdown.getMarkdown();
    mikoto.client.documents
      .update({ channelId: channel.id, content: contentString })
      .then(() => setChanged(false))
      .catch(() => setChanged(true));
  };

  useInterval(() => {
    if (editor && changed) {
      save(editor);
    }
  }, 5000);

  return (
    <>
      <div>
        <Flex
          w="100%"
          h={32}
          bg="N900"
          rounded={4}
          p={16}
          m={{ bottom: 16 }}
          style={{
            alignItems: 'center',
          }}
        >
          <Flex gap={8}>
            <Flex
              rounded={32}
              bg={changed ? 'Y700' : 'G700'}
              w={12}
              h={12}
              center
            />
          </Flex>
        </Flex>
      </div>
      {editor && <NoteBubbleMenu editor={editor} />}
      <EditorContent editor={editor} />
    </>
  );
}

export default function DocumentSurface({ channelId }: { channelId: string }) {
  const mikoto = useMikoto();
  const channel = mikoto.channels.get(channelId)!;
  const [content, setContent] = useState<string | null>(null);

  useEffect(() => {
    mikoto.client.documents.get({ channelId }).then((x) => {
      setContent(x.content);
    });
  }, [channelId]);

  return (
    <ViewContainer scroll>
      <TabName name={channel.name} icon={faFileLines} />

      <Box p={32}>
        <Heading fs={28} txt="N200">
          <Box as="span" txt="N400">
            #
          </Box>
          {channel.name}
        </Heading>
        <EditorContentWrapper>
          {content !== null && (
            <DocumentEditor channel={channel} content={content} />
          )}
        </EditorContentWrapper>
      </Box>
    </ViewContainer>
  );
}
