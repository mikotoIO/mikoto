import { type CSSProperties, type ComponentProps } from 'react';

import { normalizeMediaUrl } from '@/components/atoms/Avatar';
import { cx, onColor, spaceAccent } from '@/design';

import styles from './SpaceIcon.module.css';

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/** Deterministic fallback color for a space without an accent or image. */
export function colorFromId(id: string): string {
  const hash = hashString(id);
  const hue = hash % 360;
  return `oklch(0.55 0.25 ${hue})`;
}

/** Up to two initials from a space name ("Tide Pool" -> "TP"). */
export function spaceInitials(name: string | null | undefined): string {
  const words = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return Array.from(words[0]).slice(0, 2).join('');
  return words
    .slice(0, 2)
    .map((w) => Array.from(w)[0])
    .join('')
    .toUpperCase();
}

/** Anything space-shaped: a MikotoSpace, an API Space, or a partial. */
export interface SpaceLike {
  id: string;
  name: string;
  icon?: string | null;
}

/**
 * Background, foreground and image for a space's icon:
 * image > owner accent > colorFromId.
 */
export function spaceIconStyle(space: SpaceLike): CSSProperties {
  if (space.icon) {
    return {
      backgroundImage: `url(${normalizeMediaUrl(space.icon)})`,
      '--sa': 'transparent',
    };
  }
  const accent = spaceAccent(space);
  if (accent) return { '--sa': accent, '--sa-fg': onColor(accent) };
  return { '--sa': colorFromId(space.id), '--sa-fg': '#FFFFFF' };
}

export interface SpaceIconProps
  extends Omit<ComponentProps<'span'>, 'children'> {
  space: SpaceLike;
  /** px. Defaults to 38 (the rail size). */
  size?: number;
  /** 2px accent ring with a base-colored gap. */
  active?: boolean;
}

/**
 * A space's icon: its image, else initials on its accent color (or a
 * deterministic color from its id). Purely visual: wrap it in a button
 * when it's interactive.
 */
export function SpaceIcon({
  space,
  size = 38,
  active,
  className,
  style,
  ...rest
}: SpaceIconProps) {
  return (
    <span
      aria-hidden
      className={cx(
        styles.icon,
        size < 28 && styles.small,
        active && styles.active,
        className,
      )}
      style={{ '--size': `${size}px`, ...spaceIconStyle(space), ...style }}
      {...rest}
    >
      {space.icon ? null : spaceInitials(space.name)}
    </span>
  );
}

interface LegacySpaceIconProps {
  icon?: string;
  size?: string;
  color?: string;
  fontSize?: string;
  active?: boolean | null;
  spaceId?: string;
}

/**
 * @deprecated Use `<SpaceIcon space={space} />`. Kept with its old props so
 * existing callers keep working.
 */
export function StyledSpaceIcon({
  icon,
  size,
  color,
  fontSize,
  active,
  spaceId,
  className,
  style,
  ...rest
}: LegacySpaceIconProps & ComponentProps<'div'>) {
  const bg = icon ? 'transparent' : spaceId ? colorFromId(spaceId) : undefined;
  return (
    <div
      className={cx(
        styles.icon,
        styles.legacy,
        active && styles.active,
        className,
      )}
      style={{
        '--size': size ?? '38px',
        '--sa': bg,
        '--sa-fg': spaceId && !icon ? '#FFFFFF' : color,
        backgroundImage: icon ? `url(${icon})` : undefined,
        fontSize,
        ...style,
      }}
      {...rest}
    />
  );
}
