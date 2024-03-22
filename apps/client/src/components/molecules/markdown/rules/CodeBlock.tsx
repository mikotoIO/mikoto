import SimpleMarkdown from '@khanacademy/simple-markdown';
import { Suspense, lazy } from 'react';
import styled from '@emotion/styled';

import { createRule } from '../rules';

const CodeHighlight = lazy(() => import('../CodeHighlight'));

const CodeBlock = styled.div`
  pre {
    margin: 0;
    text-wrap: wrap;
  }
  padding: 16px;
  margin: 0;
  background-color: var(--chakra-colors-gray-800);
  color: var(--chakra-colors-gray-300);
  border-radius: 4px;
  max-width: 800px;

  & > div {
    padding: 0 !important;
  }
`;

export const codeBlockRule = createRule({
  ...SimpleMarkdown.defaultRules.codeBlock,
  react(node: any, _: any, state: any) {
    return (
      <CodeBlock key={state.key}>
        <Suspense
          fallback={
            <pre>
              <code>{node.content}</code>
            </pre>
          }
        >
          <CodeHighlight language={node.lang} content={node.content} />
        </Suspense>
      </CodeBlock>
    );
  },
});
