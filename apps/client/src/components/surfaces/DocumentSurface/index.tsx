import { faEllipsis, faFileLines } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Box, Flex, Heading } from '@mikoto-io/lucid';
import { Editor, EditorContent } from '@tiptap/react';
import { ClientChannel } from 'mikotojs';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import styled from 'styled-components';

import { useInterval, useMikoto } from '../../../hooks';
import { ContextMenu, useContextMenuX } from '../../ContextMenu';
import { TabName } from '../../TabBar';
import { ViewContainer } from '../../ViewContainer';
import { Spinner } from '../../atoms/Spinner';
import { NoteBubbleMenu } from './BubbleMenu';
import { useNoteEditor, useNoteReader } from './useNoteEditor';

const EditorContentWrapper = styled.div`
  font-size: 14px;
  line-height: 1.6;
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

const RANDOM_COLORS = [
  '#ff9999',
  '#ff9966',
  '#ffff66',
  '#99ff99',
  '#99ffff',
  '#9999ff',
];

function randomColor() {
  return RANDOM_COLORS[Math.floor(Math.random() * RANDOM_COLORS.length)];
}

function DocumentEditor({ channel, content, onChange }: DocumentEditorProps) {
  const [changed, setChanged] = useState(false);
  const [cursorColor] = useState(randomColor);

  const mikoto = useMikoto();

  const { editor, synced } = useNoteEditor({
    content,
    channel,
    cursorUser: { name: mikoto.me.name, color: cursorColor },
    onChange() {
      onChange?.();
      setChanged(true);
    },
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

  const contextMenu = useContextMenuX();

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
          alignItems="center"
          justifyContent="space-between"
        >
          <FontAwesomeIcon
            icon={faEllipsis}
            onClick={contextMenu(() => (
              <ContextMenu>
                <ContextMenu.Link
                  onClick={() => {
                    if (!editor) return;
                    const text: string = editor.storage.markdown.getMarkdown();
                    navigator.clipboard.writeText(text);
                    toast('Copied Markdown to clipboard');
                  }}
                >
                  Copy Markdown
                </ContextMenu.Link>
              </ContextMenu>
            ))}
          />
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
      {synced ? (
        <EditorContent editor={editor} />
      ) : (
        <Flex p={{ top: 32 }} justifyContent="center">
          <Spinner />
        </Flex>
      )}
    </>
  );
}

interface DocumentReaderProps {
  channel: ClientChannel;
  content: string;
}

function DocumentReader({ channel, content }: DocumentReaderProps) {
  const mikoto = useMikoto();

  const { editor } = useNoteReader(content);

  return <EditorContent editor={editor} />;
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
