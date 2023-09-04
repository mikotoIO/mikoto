import { Heading } from '@mikoto-io/lucid';
import { useMemo, useState } from 'react';
import { createEditor, Node } from 'slate';
import { withHistory } from 'slate-history';
import { Editable, ReactEditor, Slate, withReact } from 'slate-react';
import styled from 'styled-components';

import { useMikoto } from '../../hooks';
import { TabName } from '../TabBar';
import { ViewContainer } from '../ViewContainer';

const StyledEditable = styled(Editable)`
  outline: none;
  word-break: break-word;
`;

export function DocumentSurface({ channelId }: { channelId: string }) {
  const mikoto = useMikoto();
  const channel = mikoto.channels.get(channelId)!;

  const [editorValue, setEditorValue] = useState<Node[]>(() => [
    { children: [{ text: '' }] },
  ]);

  const editor: ReactEditor = useMemo(
    () => withHistory(withReact(createEditor() as ReactEditor)),
    [],
  );

  return (
    <ViewContainer padded scroll>
      <TabName name={channel.name} />
      <Heading>{channel.name}</Heading>
      <Slate
        editor={editor}
        initialValue={editorValue}
        onChange={(x) => setEditorValue(x)}
      >
        <StyledEditable placeholder="Use / for commands" />
      </Slate>
    </ViewContainer>
  );
}
