import { Heading } from '@mikoto-io/lucid';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import styled from 'styled-components';

import { useMikoto } from '../../hooks';
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

export function DocumentSurface({ channelId }: { channelId: string }) {
  const mikoto = useMikoto();
  const channel = mikoto.channels.get(channelId)!;

  const editor = useEditor({
    extensions: [StarterKit, Link, Image],
    content: '<p>Hello World! 🌎️</p>',
  });

  return (
    <ViewContainer padded scroll>
      <TabName name={channel.name} />
      <Heading>{channel.name}</Heading>
      <EditorContentWrapper>
        <EditorContent editor={editor} />
      </EditorContentWrapper>
    </ViewContainer>
  );
}
