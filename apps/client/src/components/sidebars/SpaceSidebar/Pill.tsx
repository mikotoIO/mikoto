import { cx } from '@/design';

import styles from './SpaceSidebar.module.css';

/** Unread pip on the rail's left edge. */
export function Pill({ h = 8, className }: { h?: number; className?: string }) {
  return (
    <span
      aria-hidden
      className={cx(styles.pip, className)}
      style={{ height: h, marginTop: -h / 2 }}
    />
  );
}
