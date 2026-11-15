import type { ComponentProps } from 'react';

const GLYPH =
  'M 437.953 262.575 L 38.383 386.899 L 74.043 250.759 L 473.617 126.429 L 437.953 262.575 Z M 377.891 491.869 L 255.258 350.969 L 427.196 303.644 L 377.891 491.869 Z M 134.456 20.13 L 257.089 161.031 L 85.15 208.356 L 134.456 20.13 Z';

export interface MikotoLogoProps
  extends Omit<ComponentProps<'svg'>, 'width' | 'height'> {
  /** Width and height in px (or any CSS length). Defaults to 20. */
  size?: number | string;
  /** Accessible name. Omit for a decorative logo (it is then aria-hidden). */
  title?: string;
}

/** The Mikoto glyph. Uses `currentColor`, so color it with CSS `color`. */
export function MikotoLogo({ size = 20, title, ...rest }: MikotoLogoProps) {
  return (
    <svg
      viewBox="0 0 512 512"
      width={size}
      height={size}
      fill="currentColor"
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      {...rest}
    >
      {title && <title>{title}</title>}
      <path d={GLYPH} />
    </svg>
  );
}
