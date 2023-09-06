import { Heading } from '@mikoto-io/lucid';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { ClientChannel } from 'mikotojs';
import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { useInterval, useMikoto } from '../../hooks';
import { TabName } from '../TabBar';
import { ViewContainer } from '../ViewContainer';

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
`;

interface DocumentEditorProps {
  channel: ClientChannel;
  content: string;
}

function DocumentEditor({ channel, content }: DocumentEditorProps) {
  const [changed, setChanged] = useState(false);
  const mikoto = useMikoto();

  const editor = useEditor({
    extensions: [StarterKit as any, Link, Image],
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

  return <EditorContent editor={editor} />;
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
      <TabName name={channel.name} />
      <Heading>{channel.name}</Heading>
      <EditorContentWrapper>
        {content !== null && (
          <DocumentEditor channel={channel} content={content} />
        )}
      </EditorContentWrapper>
    </ViewContainer>
  );
}
