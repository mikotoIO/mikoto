import { Box } from '@chakra-ui/react';
import SimpleMarkdown from '@khanacademy/simple-markdown';
import { useState } from 'react';

import { createRule } from '../rules';

const SPOILER_REGEX = /^\|\|([\s\S]+?)\|\|(?!\|)/;

function Spoiler({ children }: { children: React.ReactNode }) {
  const [hidden, setHidden] = useState(true);
  return (
    <Box
      display="inline-block"
      backgroundColor={hidden ? 'var(--N1100)' : 'var(--N600)'}
      color={hidden ? 'transparent' : 'text'}
      px={1}
      borderRadius="4px"
      cursor="pointer"
      onClick={() => {
        setHidden(!hidden);
      }}
    >
      {children}
    </Box>
  );
}

export const spoilerRule = createRule({
  order: SimpleMarkdown.defaultRules.em.order,
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
