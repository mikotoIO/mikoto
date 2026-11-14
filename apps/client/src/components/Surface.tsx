import { type ComponentProps } from 'react';

import { cx } from '@/design';

import styles from './Surface.module.css';

export interface SurfaceProps extends ComponentProps<'div'> {
  /** Page-like content (settings, discovery) gets 32px padding. */
  padded?: boolean;
  scroll?: boolean;
}

/** The body of a tab: fills its dock sheet, owns its own scrolling. */
export function Surface({ padded, scroll, className, ...props }: SurfaceProps) {
  return (
    <div
      className={cx(
        styles.surface,
        padded && styles.padded,
        scroll && styles.scroll,
        className,
      )}
      {...props}
    />
  );
}

export { styles as surfaceStyles };
