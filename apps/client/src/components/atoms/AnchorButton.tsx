import styled from 'styled-components';

export const AnchorButton = styled.a<{ selected?: boolean }>`
  display: block;
  cursor: pointer;
  font-size: 14px;
  padding: 8px 16px;
  border-radius: 4px;
  background-color: ${(p) => (p.selected ? 'var(--N700)' : 'transparent')};
  color: ${(p) => (p.selected ? 'white' : 'rgba(255,255,255,0.8)')};
  user-select: none;
`;
