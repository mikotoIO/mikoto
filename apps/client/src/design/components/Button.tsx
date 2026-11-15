import { type ComponentProps, type ReactNode } from 'react';

import { cx } from '../cx';
import styles from './Button.module.css';
import { Spinner } from './Spinner';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'danger'
  | 'dangerGhost';

export interface ButtonProps extends ComponentProps<'button'> {
  variant?: ButtonVariant;
  size?: 'sm' | 'md' | 'lg';
  /** Shows a spinner and disables the button, keeping its width. */
  loading?: boolean;
  block?: boolean;
}

/**
 * Buttons say exactly what they do ("Save changes", not "Submit").
 * One primary button per view; everything else is secondary or ghost.
 */
export function Button({
  variant = 'secondary',
  size = 'md',
  loading,
  block,
  disabled,
  className,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cx(
        styles.button,
        styles[variant],
        size !== 'md' && styles[size],
        block && styles.block,
        loading && styles.loading,
        className,
      )}
      {...rest}
    >
      {loading && (
        <span className={styles.spinnerWrap}>
          <Spinner size={14} />
        </span>
      )}
      {children}
    </button>
  );
}

export interface IconButtonProps extends ComponentProps<'button'> {
  /** Required: icon buttons have no visible text. */
  'aria-label': string;
  size?: 'sm' | 'md';
  variant?: 'ghost' | 'primary';
  children: ReactNode;
}

export function IconButton({
  size = 'sm',
  variant = 'ghost',
  className,
  type = 'button',
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      title={rest['aria-label']}
      className={cx(
        styles.button,
        styles.icon,
        size === 'md' && styles.md,
        variant === 'primary' && styles.primary,
        className,
      )}
      {...rest}
    />
  );
}
