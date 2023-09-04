import { useMemo, useState } from 'react';
import { createEditor, Node } from 'slate';
import { withHistory } from 'slate-history';
import { Editable, ReactEditor, Slate, withReact } from 'slate-react';
import styled from 'styled-components';

import { TabName } from '../TabBar';
import { ViewContainer } from '../ViewContainer';

const StyledEditable = styled(Editable)`
  outline: none;
`;

export function DocumentSurface({ channelId }: { channelId: string }) {
  const [editorValue, setEditorValue] = useState<Node[]>(() => [
    { children: [{ text: '' }] },
  ]);

  const editor: ReactEditor = useMemo(
    () => withHistory(withReact(createEditor() as ReactEditor)),
    [],
  );

  return (
    <ViewContainer padded scroll>
      <TabName name="Document" />
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
