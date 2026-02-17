import styled from '@emotion/styled';
import React from 'react';

import { env } from '@/env';

function isUrl(string: string) {
  try {
    new URL(string);
  } catch {
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
  userId?: string;
  size?: number;
}

export function Avatar({
  src,
  userId,
  size,
  ...rest
}: AvatarProps & React.HTMLAttributes<HTMLImageElement>) {
  const fallback = userId
    ? `${env.PUBLIC_MEDIASERVER_URL}/default-avatar/${userId}`
    : '/images/default_avatar.png';

  return (
    <StyledAvatar
      src={
        normalizeMediaUrl(src, fallback) +
        (typeof size === 'number' ? `?w=${size * 2}&h=${size * 2}` : '')
      }
      size={`${size ?? 40}px`}
      {...rest}
    />
  );
}
