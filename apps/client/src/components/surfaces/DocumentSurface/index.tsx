import {
  faBold,
  faFileLines,
  faItalic,
  faStrikethrough,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Heading } from '@mikoto-io/lucid';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import TaskItem from '@tiptap/extension-task-item';
import TaskList from '@tiptap/extension-task-list';
import { useEditor, EditorContent, BubbleMenu, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { ClientChannel } from 'mikotojs';
import { useEffect, useState } from 'react';
import styled from 'styled-components';

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
      margin-right: 16px;
      width: 16px;
      height: 16px;
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
`;

interface DocumentEditorProps {
  channel: ClientChannel;
  content: string;
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

function DocumentEditor({ channel, content }: DocumentEditorProps) {
  const [changed, setChanged] = useState(false);
  const mikoto = useMikoto();

  const editor = useEditor({
    extensions: [
      StarterKit as any,
      Link,
      Image,
      TaskList,
      TaskItem,
      SlashCommand,
      Placeholder.configure({
        placeholder: () => "press '/' for commands",
        includeChildren: true,
      }),
    ],
    onUpdate() {
      setChanged(true);
    },
    content: JSON.parse(content),
  });

  useInterval(() => {
    if (editor && changed) {
      const contentString = JSON.stringify(editor.getJSON());
      mikoto.client.documents
        .update(channel.id, contentString)
        .then(() => setChanged(false))
        .catch(() => setChanged(true));
    }
  }, 5000);

  return (
    <>
      {editor && <NoteBubbleMenu editor={editor} />}
      <EditorContent editor={editor} />
    </>
  );
}

export function DocumentSurface({ channelId }: { channelId: string }) {
  const mikoto = useMikoto();
  const channel = mikoto.channels.get(channelId)!;
  const [content, setContent] = useState<string | null>(null);

  useEffect(() => {
    mikoto.client.documents.get(channelId).then((x) => {
      setContent(x.content);
    });
  }, [channelId]);

  return (
    <ViewContainer padded scroll>
      <TabName name={channel.name} icon={faFileLines} />
      <Heading>{channel.name}</Heading>
      <EditorContentWrapper>
        {content !== null && (
          <DocumentEditor channel={channel} content={content} />
        )}
      </EditorContentWrapper>
    </ViewContainer>
  );
}
