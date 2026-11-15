import { isAxiosError } from 'axios';

export interface BackoffOptions {
  /** Delay before the first retry. */
  baseMs?: number;
  /** Upper bound for any single delay. */
  maxMs?: number;
}

/**
 * Exponential backoff with "equal jitter": half the delay is fixed, half is
 * random. Spreads reconnects out after a server restart without ever
 * retrying immediately.
 */
export function backoffDelay(
  attempt: number,
  { baseMs = 1000, maxMs = 30_000 }: BackoffOptions = {},
): number {
  const exp = Math.min(maxMs, baseMs * 2 ** Math.max(0, attempt));
  return exp / 2 + Math.random() * (exp / 2);
}

/** Resolves after `ms`, or immediately when `signal` aborts. */
export function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (signal?.aborted) return resolve();
    const timer = setTimeout(done, ms);
    function done() {
      clearTimeout(timer);
      signal?.removeEventListener('abort', done);
      resolve();
    }
    signal?.addEventListener('abort', done, { once: true });
  });
}

/** The server rejected our credentials; retrying won't help. */
export function isAuthError(error: unknown): boolean {
  if (!isAxiosError(error)) return false;
  const status = error.response?.status;
  return status === 401 || status === 403;
}

/**
 * Whether an error is worth retrying: network failures, timeouts, 408,
 * 429 and 5xx. Other 4xx responses are permanent.
 */
export function isTransientError(error: unknown): boolean {
  if (!isAxiosError(error)) return false;
  const status = error.response?.status;
  if (status === undefined) return true; // no response: network / CORS / timeout
  return status === 408 || status === 429 || status >= 500;
}

export interface RetryOptions extends BackoffOptions {
  signal?: AbortSignal;
  /** Give up after this many attempts (default: retry forever). */
  maxAttempts?: number;
  /** Decide whether to retry; defaults to `isTransientError`. */
  shouldRetry?: (error: unknown, attempt: number) => boolean;
  onRetry?: (error: unknown, attempt: number, delayMs: number) => void;
}

/**
 * Run `fn` until it succeeds, a non-retryable error is thrown, attempts run
 * out, or `signal` aborts (which rejects with the last error).
 */
export async function retry<T>(
  fn: (attempt: number) => Promise<T>,
  {
    signal,
    maxAttempts = Infinity,
    shouldRetry = isTransientError,
    onRetry,
    ...backoff
  }: RetryOptions = {},
): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn(attempt);
    } catch (error) {
      const last = attempt + 1 >= maxAttempts;
      if (last || signal?.aborted || !shouldRetry(error, attempt)) throw error;
      const delay = backoffDelay(attempt, backoff);
      onRetry?.(error, attempt, delay);
      await sleep(delay, signal);
      if (signal?.aborted) throw error;
    }
  }
}
