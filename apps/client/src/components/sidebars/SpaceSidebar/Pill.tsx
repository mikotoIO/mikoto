import styled from '@emotion/styled';

export const Pill = styled.div<{ h?: number }>`
  background-color: white;
  width: 4px;
  height: ${(p) => p.h ?? 8}px;
  position: absolute;
  border-top-right-radius: 4px;
  border-bottom-right-radius: 4px;
  left: 0;
  top: 50%;
  transform: translate(0, -50%);
  transition-duration: 200ms;
`;
