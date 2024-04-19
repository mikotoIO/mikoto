import styled from '@emotion/styled';
import SimpleMarkdown from '@khanacademy/simple-markdown';
import { Suspense, lazy } from 'react';

import { createRule } from '@/components/molecules/markdown/rules';

import { highlightTheme } from './highlightTheme';

const CodeHighlight = lazy(() => import('./CodeHighlight'));

const CodeBlock = styled.div`
  pre {
    margin: 0;
    text-wrap: wrap;
  }
  padding: 16px;
  margin: 0;
  background-color: ${highlightTheme.hljs.background};
  color: ${highlightTheme.hljs.color};
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
        {node.lang === undefined ? (
          <pre>
            <code>{node.content}</code>
          </pre>
        ) : (
          <Suspense
            fallback={
              <pre>
                <code>{node.content}</code>
              </pre>
            }
          >
            <CodeHighlight language={node.lang} content={node.content} />
          </Suspense>
        )}
      </CodeBlock>
    );
  },
});
