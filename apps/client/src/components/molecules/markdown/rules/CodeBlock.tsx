import SimpleMarkdown from '@khanacademy/simple-markdown';
import { Suspense, lazy } from 'react';
import styled from 'styled-components';

import { createRule } from '../rules';

const CodeHighlight = lazy(() => import('../CodeHighlight'));

const CodeBlock = styled.div`
  pre {
    margin: 0;
    text-wrap: wrap;
  }
  padding: 16px;
  margin: 0;
  background-color: var(--N1000);
  color: var(--N300);
  border-radius: 4px;
  max-width: 800px;

  .hljs-comment {
    color: var(--N400);
  }
  .hljs-string {
    color: var(--G700);
  }
  .hljs-keyword {
    color: var(--V400);
  }
  .hljs-title.class_ {
    color: var(--Y600);
  }
  .hljs-title {
    color: var(--B500);
  }

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
