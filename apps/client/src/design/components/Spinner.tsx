import styles from './Feedback.module.css';

/**
 * Small inline spinner. Only for actions in progress (a pressed button, a
 * pending send). Content that has a known shape loads with a Skeleton instead.
 */
export function Spinner({
  size = 16,
  label,
}: {
  size?: number;
  label?: string;
}) {
  return (
    <svg
      className={styles.spinner}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      role={label ? 'status' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <circle cx="12" cy="12" r="9" fill="none" strokeWidth="2.5" />
    </svg>
  );
}
