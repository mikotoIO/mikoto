import { Link } from '@chakra-ui/react';
import SimpleMarkdown from '@khanacademy/simple-markdown';

import { createRule } from '../rules';

export const linkRule = createRule({
  ...SimpleMarkdown.defaultRules.link,
  react(node: any, output: any, state: any) {
    return (
      <Link
        key={state.key}
        href={SimpleMarkdown.sanitizeUrl(node.target) ?? '#'}
        target="_blank"
      >
        {output(node.content, state)}
      </Link>
    );
  },
});
