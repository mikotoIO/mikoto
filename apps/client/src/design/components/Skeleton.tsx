import { type CSSProperties, type ReactNode, useEffect, useState } from 'react';

import { cx } from '../cx';
import styles from './Feedback.module.css';

type Size = number | string;
const toCss = (v: Size | undefined) => (typeof v === 'number' ? `${v}px` : v);

export interface SkeletonProps {
  width?: Size;
  height?: Size;
  /** Render in the avatar shape. Uses `width` for both dimensions. */
  circle?: boolean;
  radius?: Size;
  className?: string;
  style?: CSSProperties;
}

/**
 * A placeholder block. Skeletons must mirror the real layout (same heights,
 * same gaps) so nothing jumps when content arrives.
 */
export function Skeleton({
  width = '100%',
  height = 12,
  circle,
  radius,
  className,
  style,
}: SkeletonProps) {
  return (
    <span
      aria-hidden
      className={cx(styles.skeleton, circle && styles.avatarShape, className)}
      style={{
        width: toCss(width),
        height: toCss(circle ? width : height),
        borderRadius: circle ? undefined : toCss(radius),
        ...style,
      }}
    />
  );
}

const LINE_WIDTHS = ['92%', '78%', '85%', '64%', '88%', '55%'];

/** A paragraph of skeleton lines with natural, deterministic widths. */
export function SkeletonText({
  lines = 3,
  lineHeight = 12,
  gap = 9,
  seed = 0,
}: {
  lines?: number;
  lineHeight?: number;
  gap?: number;
  seed?: number;
}) {
  return (
    <span className={styles.skeletonText} style={{ gap }} aria-hidden>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton
          key={i}
          height={lineHeight}
          width={
            i === lines - 1 && lines > 1
              ? '45%'
              : LINE_WIDTHS[(i + seed) % LINE_WIDTHS.length]
          }
        />
      ))}
    </span>
  );
}

/**
 * Wraps a region that is loading, so assistive tech hears one
 * "Loading <label>" instead of a pile of empty shapes.
 */
export function SkeletonGroup({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={className}
      role="status"
      aria-busy="true"
      aria-label={`Loading ${label}`}
    >
      {children}
    </div>
  );
}

/* --------------------------------------------------------------- timing
 * The loading model:
 *  1. Render what you already know immediately (names, icons, headers).
 *  2. For unknown content show nothing for SKELETON_DELAY ms, so fast loads
 *     never flash a skeleton.
 *  3. Once a skeleton is visible, keep it at least SKELETON_MIN ms so it
 *     doesn't flicker on and off. (React already throttles Suspense reveals,
 *     so <DelayedFallback> only needs the delay.)
 *  4. Content fades in; it doesn't slide.
 */
export const SKELETON_DELAY = 150;
export const SKELETON_MIN = 300;

/**
 * Suspense fallback wrapper: renders nothing for SKELETON_DELAY ms, then the
 * skeleton. `<Suspense fallback={<DelayedFallback><ChatSkeleton/></DelayedFallback>}>`
 */
export function DelayedFallback({
  children,
  delay = SKELETON_DELAY,
}: {
  children: ReactNode;
  delay?: number;
}) {
  const [show, setShow] = useState(delay <= 0);
  useEffect(() => {
    if (delay <= 0) return;
    const t = setTimeout(() => setShow(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return show ? <>{children}</> : null;
}

/**
 * For non-Suspense loading flags (mutations, manual fetches). Returns
 * whether the skeleton should currently be visible, applying the delay and
 * minimum-duration rules above.
 */
export function useSkeletonVisible(
  loading: boolean,
  { delay = SKELETON_DELAY, minDuration = SKELETON_MIN } = {},
): boolean {
  const [visible, setVisible] = useState(false);
  const [shownAt, setShownAt] = useState<number | null>(null);

  useEffect(() => {
    if (loading && !visible) {
      const t = setTimeout(() => {
        setVisible(true);
        setShownAt(Date.now());
      }, delay);
      return () => clearTimeout(t);
    }
    if (!loading && visible) {
      const elapsed = shownAt === null ? minDuration : Date.now() - shownAt;
      const t = setTimeout(
        () => {
          setVisible(false);
          setShownAt(null);
        },
        Math.max(0, minDuration - elapsed),
      );
      return () => clearTimeout(t);
    }
  }, [loading, visible, shownAt, delay, minDuration]);

  return visible;
}

/**
 * `<Deferred loading={isLoading} skeleton={<ListSkeleton/>}>{content}</Deferred>`
 * Applies the loading model to a boolean flag and fades content in.
 */
export function Deferred({
  loading,
  skeleton,
  children,
}: {
  loading: boolean;
  skeleton: ReactNode;
  children: ReactNode;
}) {
  const showSkeleton = useSkeletonVisible(loading);
  if (showSkeleton) return <>{skeleton}</>;
  if (loading) return null;
  return <div className={styles.fadeIn}>{children}</div>;
}
