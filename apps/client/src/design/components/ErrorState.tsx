import { QueryErrorResetBoundary } from '@tanstack/react-query';
import { CircleAlert, Copy, RefreshCw } from 'lucide-react';
import { type ReactNode } from 'react';
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary';

import { cx } from '../cx';
import { describeError } from '../errors';
import { Button } from './Button';
import styles from './States.module.css';
import { toast } from './Toast';

async function copyDetails(details: string) {
  try {
    await navigator.clipboard.writeText(details);
    toast({ title: 'Copied error details', type: 'success' });
  } catch {
    toast({ title: "Couldn't copy to the clipboard", type: 'error' });
  }
}

export interface ErrorStateProps {
  /** What failed to load, as the user would name it: "#general", "Members". */
  what: string;
  error: unknown;
  onRetry?: () => void;
  /**
   * surface: fills a whole tab. region: a card inside a page (member list,
   * sidebar). inline: one line, for list items and small widgets.
   */
  variant?: 'surface' | 'region' | 'inline';
  /** Extra sentence, e.g. "Your draft is saved." */
  note?: string;
  className?: string;
}

export function ErrorState({
  what,
  error,
  onRetry,
  variant = 'surface',
  note,
  className,
}: ErrorStateProps) {
  const described = describeError(error);
  const retry = onRetry && described.retryable;

  if (variant === 'inline') {
    return (
      <div className={cx(styles.inlineError, className)} role="alert">
        <CircleAlert size={14} aria-hidden />
        <span>{what} couldn't be displayed.</span>
        {retry && (
          <button type="button" className={styles.link} onClick={onRetry}>
            Try again
          </button>
        )}
      </div>
    );
  }

  if (variant === 'region') {
    return (
      <div className={cx(styles.regionError, className)} role="alert">
        <p className={styles.regionTitle}>
          <CircleAlert size={15} aria-hidden />
          {what} didn't load
        </p>
        <p className={styles.regionText}>{described.message}</p>
        {retry && (
          <Button size="sm" onClick={onRetry}>
            <RefreshCw size={13} aria-hidden />
            Try again
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={cx(styles.state, className)} role="alert">
      <div className={styles.card}>
        <div className={cx(styles.icon, styles.iconDanger)}>
          <CircleAlert size={20} aria-hidden />
        </div>
        <h2 className={styles.title}>{what} didn't load</h2>
        <p className={styles.text}>
          {described.message}
          {note ? ` ${note}` : ''}
        </p>
        <div className={styles.actions}>
          {retry && (
            <Button variant="primary" onClick={onRetry}>
              <RefreshCw size={14} aria-hidden />
              Try again
            </Button>
          )}
          <Button onClick={() => copyDetails(described.details)}>
            <Copy size={14} aria-hidden />
            Copy details
          </Button>
        </div>
        <details className={styles.details}>
          <summary>Technical details</summary>
          <pre>{described.details}</pre>
        </details>
      </div>
    </div>
  );
}

interface BoundaryProps {
  what: string;
  children: ReactNode;
  /** Reset the boundary when any of these change (e.g. channel id). */
  resetKeys?: unknown[];
  note?: string;
  className?: string;
}

function ErrorBoundaryWithState({
  what,
  children,
  resetKeys,
  note,
  className,
  variant,
}: BoundaryProps & { variant: ErrorStateProps['variant'] }) {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          onReset={reset}
          resetKeys={resetKeys}
          fallbackRender={({ error, resetErrorBoundary }: FallbackProps) => (
            <ErrorState
              what={what}
              error={error}
              onRetry={resetErrorBoundary}
              variant={variant}
              note={note}
              className={className}
            />
          )}
        >
          {children}
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}

/** Wraps a whole tab. A crash here never affects other tabs. */
export function SurfaceErrorBoundary(props: BoundaryProps) {
  return <ErrorBoundaryWithState {...props} variant="surface" />;
}

/** Wraps an independent region (member list, sidebar section, embed). */
export function RegionErrorBoundary(props: BoundaryProps) {
  return <ErrorBoundaryWithState {...props} variant="region" />;
}

/** Wraps a single list item (a message, a member row). */
export function ItemErrorBoundary(props: BoundaryProps) {
  return <ErrorBoundaryWithState {...props} variant="inline" />;
}

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  /** Say what to do next: an empty screen is an invitation to act. */
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cx(styles.state, className)}>
      <div className={styles.card}>
        {icon && <div className={styles.icon}>{icon}</div>}
        <h2 className={styles.title}>{title}</h2>
        {description && <p className={styles.text}>{description}</p>}
        {action && <div className={styles.actions}>{action}</div>}
      </div>
    </div>
  );
}
