import styled from '@emotion/styled';
import { lazy } from 'react';

import { highlightTheme } from './highlightTheme';

export const CodeHighlight = lazy(() => import('./CodeHighlight'));

export const CodeBlock = styled.div`
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
