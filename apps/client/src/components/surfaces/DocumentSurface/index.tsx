import {
  faBold,
  faFileLines,
  faItalic,
  faStrikethrough,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Box, Flex, Heading } from '@mikoto-io/lucid';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import TaskItem from '@tiptap/extension-task-item';
import TaskList from '@tiptap/extension-task-list';
import YouTube from '@tiptap/extension-youtube';
import {
  useEditor,
  EditorContent,
  BubbleMenu,
  Editor,
  Extensions,
} from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { ClientChannel } from 'mikotojs';
import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Markdown } from 'tiptap-markdown';

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

const extensions = [
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
  YouTube,
  Markdown,
] satisfies Extensions;

function DocumentEditor({ channel, content }: DocumentEditorProps) {
  const [changed, setChanged] = useState(false);
  const mikoto = useMikoto();

  const editor = useEditor({
    extensions,
    onUpdate() {
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

const StyledEditorHeader = styled.div`
  display: block;
  height: 40px;
  width: 100%;
  background-color: var(--N1000);
`;

function EditorHeader() {
  return <StyledEditorHeader>lol</StyledEditorHeader>;
}

export function DocumentSurface({ channelId }: { channelId: string }) {
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
