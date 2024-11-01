import { css } from '@emotion/react';
import styled from '@emotion/styled';

export const viewContainerCss = css`
  box-sizing: border-box;
  flex: 1;
  background-color: var(--chakra-colors-surface);
  height: 100%;
  display: flex;
  flex-direction: column;
`;

export const Surface = styled.div<{ padded?: boolean; scroll?: boolean }>`
  ${viewContainerCss}

  padding: ${(p) => (p.padded ? '32px' : '0')};
  overflow-y: ${(p) => (p.scroll ? 'scroll' : 'hidden')};
`;
