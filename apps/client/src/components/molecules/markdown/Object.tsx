import SimpleMarkdown from '@khanacademy/simple-markdown';

import { createRule } from './rules';

const OBJECT_REGEX = /^<(\w+):([^\n]*)>/;

export const objectRule = createRule({
  order: SimpleMarkdown.defaultRules.em.order + 1,
  match(source: string) {
    return OBJECT_REGEX.exec(source);
  },
  parse(capture: string[]) {
    // apparently, having a field that is named `type` causes an error.
    // this is probably because `type` is reserved for markdown nodes.
    return {
      resource: capture[1],
      data: capture[2],
    };
  },
  react(node, _, state) {
    return (
      <div key={state.key}>
        object test: {node.resource} {node.data}
      </div>
    );
  },
});
