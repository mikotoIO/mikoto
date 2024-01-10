import SimpleMarkdown from '@khanacademy/simple-markdown';
import { Anchor } from '@mikoto-io/lucid';

import { createRule } from '../rules';

export const linkRule = createRule({
  ...SimpleMarkdown.defaultRules.link,
  react(node: any, output: any, state: any) {
    return (
      <Anchor
        key={state.key}
        href={SimpleMarkdown.sanitizeUrl(node.target) ?? '#'}
        target="_blank"
      >
        {output(node.content, state)}
      </Anchor>
    );
  },
});
