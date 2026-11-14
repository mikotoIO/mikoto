import { User } from 'lucide-react';
import React, { useState } from 'react';

import { cx } from '@/design';
import { env } from '@/env';

import styles from './Avatar.module.css';

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

/** A stable hue (0-359) for an id, so a user's fallback color never changes. */
export function hueFromId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) | 0;
  }
  return Math.abs(h) % 360;
}

function initialOf(name?: string | null) {
  const first = name ? Array.from(name.trim())[0] : undefined;
  return first?.toUpperCase();
}

interface AvatarProps {
  src?: string | null;
  userId?: string;
  size?: number;
  /** Used for the initials fallback and the alt text. */
  name?: string | null;
}

/**
 * A round user avatar. Without an image it uses the server's generated
 * default; if an image fails to load it shows the user's initial on a color
 * derived from their id, never a broken-image icon.
 */
export function Avatar({
  src,
  userId,
  size,
  name,
  className,
  style,
  ...rest
}: AvatarProps & React.HTMLAttributes<HTMLElement>) {
  const px = size ?? 40;
  const base = src
    ? normalizeMediaUrl(src)
    : userId
      ? `${env.PUBLIC_MEDIASERVER_URL}/default-avatar/${userId}`
      : null;
  const url = base ? `${base}?w=${px * 2}&h=${px * 2}` : null;

  // Remember which URL failed, so a new src gets a fresh attempt.
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const clickable = Boolean(rest.onClick);
  const cssVars: React.CSSProperties = {
    '--size': `${px}px`,
    '--h': hueFromId(userId ?? name ?? ''),
    ...style,
  };

  if (url && failedUrl !== url) {
    return (
      <img
        {...rest}
        src={url}
        alt={name ?? ''}
        draggable={false}
        className={cx(styles.avatar, clickable && styles.clickable, className)}
        style={cssVars}
        onError={() => setFailedUrl(url)}
      />
    );
  }

  const initial = initialOf(name);
  return (
    <span
      role="img"
      aria-label={name ?? 'User'}
      className={cx(
        styles.avatar,
        styles.fallback,
        !userId && !initial && styles.anonymous,
        clickable && styles.clickable,
        className,
      )}
      style={cssVars}
      {...rest}
    >
      {initial ?? <User size={Math.round(px * 0.55)} aria-hidden />}
    </span>
  );
}
