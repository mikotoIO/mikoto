import { Box } from '@chakra-ui/react';
import SimpleMarkdown from '@khanacademy/simple-markdown';

import { createRule } from '../rules';

const OBJECT_REGEX = /^<(\w+):([^\n]*)>/;

function ObjectNotFound({ resource }: { resource: string }) {
  return (
    <Box m={1} p={4} bg="gray.800" rounded="md" maxW="300px">
      Object not found: {resource}
    </Box>
  );
}

function Object({ resource, data }: { resource: string; data: string }) {
  return <ObjectNotFound resource={resource} />;
}

export const objectRule = createRule({
  order: SimpleMarkdown.defaultRules.paragraph.order + 1,
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
    return <Object key={state.key} resource={node.resource} data={node.data} />;
  },
});
