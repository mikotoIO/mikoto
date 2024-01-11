import { Flex } from '@mikoto-io/lucid';
import styled from 'styled-components';

interface SpaceIconProps {
  active?: boolean | null;
  icon?: string;
  size?: number;
}

export const StyledSpaceIcon = styled(Flex)<SpaceIconProps>`
  width: ${(p) => p.size ?? 48}px;
  height: ${(p) => p.size ?? 48}px;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background-color: var(--N800);
  transition-duration: 100ms;
  background-image: url(${(p) => p.icon ?? 'none'});
  background-size: cover;
  font-size: ${(p) => p.fs ?? 14}px;
  cursor: pointer;
`;
