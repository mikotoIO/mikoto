import React from 'react';
import styled from 'styled-components';

import { env } from '../../env';

function isUrl(string: string) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const url = new URL(string);
  } catch (__) {
    return false;
  }
  return true;
}

export function normalizeMediaUrl(url?: string | null, fallback = '') {
  if (!url) {
    return fallback;
  }
  return isUrl(url) ? url : `${env.PUBLIC_MEDIASERVER_URL}/${url}`;
}

const StyledAvatar = styled.img<{ size?: number | string }>`
  user-select: none;
  background-color: var(--chakra-colors-gray-800);
  width: ${(p) => (typeof p.size === 'number' ? `${p.size}px` : p.size)};
  height: ${(p) => (typeof p.size === 'number' ? `${p.size}px` : p.size)};
  border-radius: 8px;
  cursor: pointer;
`;

interface AvatarProps {
  src?: string | null;
  size?: number;
}

export function Avatar({
  src,
  size,
  ...rest
}: AvatarProps & React.HTMLAttributes<HTMLImageElement>) {
  return (
    <StyledAvatar
      src={
        normalizeMediaUrl(src, '/images/default_avatar.png') +
        (typeof size === 'number' ? `?w=${size * 2}&h=${size * 2}` : '')
      }
      size={`${size ?? 40}px`}
      {...rest}
    />
  );
}
