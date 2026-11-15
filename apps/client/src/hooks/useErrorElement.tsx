import { isAxiosError } from 'axios';
import { CircleAlert, X } from 'lucide-react';
import { type ReactNode, useCallback, useState } from 'react';

import { IconButton, cx, describeError } from '@/design';

import styles from './useErrorElement.module.css';

interface AppError {
  name: string;
  message: string;
}

function hasMessage(value: unknown): value is { message: string } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'message' in value &&
    typeof value.message === 'string' &&
    value.message.length > 0
  );
}

/**
 * Turns anything a caller hands us into a user-facing error. Request
 * failures go through describeError; plain errors and `{ message }` bodies
 * (e.g. an API's error payload) keep their own message.
 */
export function toAppError(value: unknown): AppError | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') return { name: 'Error', message: value };
  if (isAxiosError(value)) {
    return {
      name: 'RequestError',
      message: describeError(value, { context: 'action' }).message,
    };
  }
  if (hasMessage(value)) {
    const name =
      'name' in value && typeof value.name === 'string' ? value.name : 'Error';
    return { name, message: value.message };
  }
  return {
    name: 'Error',
    message: describeError(value, { context: 'action' }).message,
  };
}

/** Inline danger callout. Use for errors from an action the user just took. */
export function ErrorCallout({
  children,
  onDismiss,
  className,
}: {
  children: ReactNode;
  onDismiss?: () => void;
  className?: string;
}) {
  return (
    <div className={cx(styles.callout, className)} role="alert">
      <CircleAlert size={16} className={styles.icon} aria-hidden />
      <p className={styles.message}>{children}</p>
      {onDismiss && (
        <IconButton
          aria-label="Dismiss"
          className={styles.dismiss}
          onClick={onDismiss}
        >
          <X size={14} />
        </IconButton>
      )}
    </div>
  );
}

/**
 * `const { el, setError } = useErrorElement()`. Render `el` where the error
 * should appear. `setError` accepts an `{ name, message }`, a string, any
 * thrown value (run through describeError), or null to clear.
 */
export function useErrorElement() {
  const [appError, setAppError] = useState<AppError | null>(null);
  const setError = useCallback((value: AppError | unknown) => {
    setAppError(toAppError(value));
  }, []);

  return {
    el: appError && (
      <ErrorCallout onDismiss={() => setAppError(null)}>
        {appError.message}
      </ErrorCallout>
    ),
    error: appError,
    setError,
  };
}
