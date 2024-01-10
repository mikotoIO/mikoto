import SimpleMarkdown from '@khanacademy/simple-markdown';
import { useState } from 'react';
import styled from 'styled-components';

import { createRule } from '../rules';

const SPOILER_REGEX = /^\|\|([\s\S]+?)\|\|(?!\|)/;

const StyledSpoiler = styled.span<{ hide: boolean }>`
  background-color: ${(p) => (p.hide ? 'var(--N1100)' : 'var(--N600)')};
  color: ${(p) => (p.hide ? 'transparent' : 'var(--N0)')};
  padding: 0px 4px;
  border-radius: 4px;
  cursor: pointer;
`;

function Spoiler({ children }: { children: React.ReactNode }) {
  const [hidden, setHidden] = useState(true);
  return (
    <StyledSpoiler
      hide={hidden}
      onClick={() => {
        setHidden(!hidden);
      }}
    >
      {children}
    </StyledSpoiler>
  );
}

export const spoilerRule = createRule({
  order: SimpleMarkdown.defaultRules.em.order + 1,
  match(source: string) {
    return SPOILER_REGEX.exec(source);
  },
  parse(capture: string[]) {
    return {
      content: capture[1],
    };
  },
  react(node, _, state) {
    return <Spoiler key={state.key}>{node.content}</Spoiler>;
  },
});
