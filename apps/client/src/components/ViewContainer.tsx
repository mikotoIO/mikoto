import styled, { css } from 'styled-components';

export const viewContainerCss = css`
  box-sizing: border-box;
  flex: 1;
  border-radius: 8px;
  background-color: var(--color-surface);
  height: 100%;
  display: flex;
  flex-direction: column;
`;

export const ViewContainer = styled.div<{ padded?: boolean; scroll?: boolean }>`
  ${viewContainerCss}

  padding: ${(p) => (p.padded ? '32px' : '0')};
  overflow-y: ${(p) => (p.scroll ? 'scroll' : 'hidden')};
`;
