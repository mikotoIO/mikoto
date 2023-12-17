import styled from 'styled-components';

interface SpaceIconProps {
  active?: boolean | null;
  icon?: string;
  size?: number;
}

export const StyledSpaceIcon = styled.div<SpaceIconProps>`
  width: ${(p) => p.size ?? 48}px;
  height: ${(p) => p.size ?? 48}px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: ${(p) => (p.active ? 16 : 100)}px;
  background-color: var(--N800);
  transition-duration: 100ms;
  background-image: url(${(p) => p.icon ?? 'none'});
  background-size: cover;
  cursor: pointer;
`;
