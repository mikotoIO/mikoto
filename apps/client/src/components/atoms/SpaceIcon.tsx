import styled from '@emotion/styled';
import React from 'react';

interface SpaceIconProps {
  icon?: string;
  size?: string;
  color?: string;
  fontSize?: string;
  active?: boolean | null;
  spaceId?: string;
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function colorFromId(id: string): string {
  const hash = hashString(id);
  const hue = hash % 360;
  return `oklch(0.55 0.25 ${hue})`;
}

// layout equivalent to a space icon
export const SpaceIconLike = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;

  width: 40px;
  height: 40px;

  font-family: var(--font-heading);
  font-size: 14px;
  cursor: pointer;
  border-radius: 4px;
`;

const SpaceIcon = styled.div<{
  icon?: string;
  size?: string;
  fontSize?: string;
  active?: boolean | null;
  bgColor?: string;
}>`
  display: flex;
  align-items: center;
  justify-content: center;

  width: ${(p) => p.size ?? '40px'};
  height: ${(p) => p.size ?? '40px'};
  background-color: ${(p) =>
    p.icon
      ? 'transparent'
      : p.bgColor
        ? p.bgColor
        : p.active
          ? 'var(--chakra-colors-gray-700)'
          : 'var(--chakra-colors-surface)'};
  background-size: cover;
  background-image: ${(p) => (p.icon ? `url(${p.icon})` : 'none')};
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: 16px;
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
  spaceId,
  ...rest
}: SpaceIconProps & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <SpaceIconOutline active={active}>
      <SpaceIcon
        icon={icon}
        size={size}
        fontSize={fontSize}
        active={active}
        bgColor={spaceId && !icon ? colorFromId(spaceId) : undefined}
        {...rest}
      />
    </SpaceIconOutline>
  );
}
