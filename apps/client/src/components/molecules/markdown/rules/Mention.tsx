import SimpleMarkdown from '@khanacademy/simple-markdown';
import styled from '@emotion/styled';

import { createRule } from '../rules';

const Mention = styled.span`
  background-color: #7591ff80;
  border-radius: 4px;
  padding: 0 2px;
`;

export const mentionRule = createRule({
  order: SimpleMarkdown.defaultRules.em.order + 1,
  match(source: string) {
    return /^@(\w+)/.exec(source);
  },

  parse(capture: string[]) {
    return {
      content: capture[1],
    };
  },

  react(node, _, state) {
    return <Mention key={state.key}>@{node.content}</Mention>;
  },
});
