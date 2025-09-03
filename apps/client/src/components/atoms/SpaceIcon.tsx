import styled from '@emotion/styled';
import React from 'react';

interface SpaceIconProps {
  icon?: string;
  size?: string;
  color?: string;
  fontSize?: string;
  active?: boolean | null;
}

// layout equivalent to a space icon
export const SpaceIconLike = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;

  width: 40px;
  height: 40px;

  font-size: 14px;
  cursor: pointer;
  border-radius: 4px;
`;

const SpaceIcon = styled.div<{
  icon?: string;
  size?: string;
  fontSize?: string;
  active?: boolean | null;
}>`
  display: flex;
  align-items: center;
  justify-content: center;

  width: ${(p) => p.size ?? '40px'};
  height: ${(p) => p.size ?? '40px'};
  background-color: ${(p) =>
    p.active
      ? 'var(--chakra-colors-gray-700)'
      : 'var(--chakra-colors-surface)'};
  background-size: cover;
  background-image: ${(p) => (p.icon ? `url(${p.icon})` : 'none')};
  font-size: 14px;
  cursor: pointer;
  border-radius: 4px;
`;

const SpaceIconOutline = styled.div<{
  active?: boolean | null;
}>`
  border-radius: 6px;
  padding: 2px;
  border: 2px solid transparent;
  border-color: ${(p) =>
    p.active ? 'var(--chakra-colors-gray-150)' : 'transparent'};
`;

export function StyledSpaceIcon({
  icon,
  size,
  fontSize,
  active,
  ...rest
}: SpaceIconProps & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <SpaceIconOutline active={active}>
      <SpaceIcon
        icon={icon}
        size={size}
        fontSize={fontSize}
        active={active}
        {...rest}
      />
    </SpaceIconOutline>
  );
}
