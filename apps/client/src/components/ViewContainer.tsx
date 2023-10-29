import styled from 'styled-components';

export const ViewContainer = styled.div<{ padded?: boolean; scroll?: boolean }>`
  flex: 1;
  background-color: var(--N800);
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: ${(p) => (p.padded ? '32px' : '0')};
  overflow-y: ${(p) => (p.scroll ? 'scroll' : 'hidden')};
  box-sizing: border-box;
`;
