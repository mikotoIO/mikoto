import { isAxiosError } from 'axios';

export interface DescribedError {
  /** One sentence, in the interface's voice: what happened and what to do. */
  message: string;
  /** Whether trying again could plausibly succeed. */
  retryable: boolean;
  status?: number;
  /** Technical details for "Copy details" / bug reports. */
  details: string;
}

export interface DescribeOptions {
  /**
   * load (default): something failed to appear ("#general didn't load").
   * action: something the user just did failed ("Couldn't save changes").
   * Actions prefer the server's own explanation for 4xx responses, and pass
   * through the message of non-request errors (e.g. validation).
   */
  context?: 'load' | 'action';
}

/**
 * Turns any thrown value into user-facing copy. Errors never apologize and
 * never say just "something went wrong": they say what happened and how to
 * fix it.
 */
export function describeError(
  error: unknown,
  { context = 'load' }: DescribeOptions = {},
): DescribedError {
  const details = technicalDetails(error);
  const action = context === 'action';

  if (action && isAxiosError(error) && error.response) {
    const status = error.response.status;
    const serverMessage = readServerMessage(error.response.data);
    if (serverMessage && status >= 400 && status < 500 && status !== 429) {
      return { message: serverMessage, retryable: false, status, details };
    }
    if (status === 401) {
      return {
        message: "You're signed out. Sign in again, then retry.",
        retryable: false,
        status,
        details,
      };
    }
  }

  if (isAxiosError(error)) {
    const status = error.response?.status;
    if (!error.response) {
      return navigator.onLine
        ? {
            message:
              "Couldn't reach the server. Check your connection and try again.",
            retryable: true,
            details,
          }
        : {
            message: "You're offline. This will load when you reconnect.",
            retryable: true,
            details,
          };
    }
    if (status === 401)
      return {
        message: 'Your session expired. Sign in again to continue.',
        retryable: false,
        status,
        details,
      };
    if (status === 403)
      return {
        message: "You don't have permission to see this.",
        retryable: false,
        status,
        details,
      };
    if (status === 404)
      return {
        message: 'It may have been deleted, or the link is wrong.',
        retryable: false,
        status,
        details,
      };
    if (status === 429)
      return {
        message: 'Too many requests. Wait a few seconds and try again.',
        retryable: true,
        status,
        details,
      };
    if (status && status >= 500)
      return {
        message: 'The server ran into a problem. Try again in a moment.',
        retryable: true,
        status,
        details,
      };
    const serverMessage = readServerMessage(error.response.data);
    return {
      message: serverMessage ?? 'The request was rejected.',
      retryable: false,
      status,
      details,
    };
  }

  if (action) {
    const own =
      error instanceof Error && error.message && error.message.length < 200
        ? error.message
        : typeof error === 'string' && error.length < 200
          ? error
          : null;
    return {
      message: own ?? 'The app hit an unexpected problem. Try again.',
      retryable: true,
      details,
    };
  }

  return {
    message: 'Part of the app crashed while showing this.',
    retryable: true,
    details,
  };
}

function readServerMessage(data: unknown): string | undefined {
  if (typeof data === 'object' && data !== null && 'message' in data) {
    const { message } = data;
    if (typeof message === 'string' && message.length < 200) return message;
  }
  return undefined;
}

function technicalDetails(error: unknown): string {
  const lines: string[] = [];
  if (isAxiosError(error)) {
    const method = error.config?.method?.toUpperCase() ?? 'GET';
    lines.push(`${method} ${error.config?.url ?? '(unknown url)'}`);
    lines.push(
      error.response
        ? `${error.response.status} ${error.response.statusText}`
        : `No response (${error.code ?? 'network error'})`,
    );
  }
  if (error instanceof Error) {
    lines.push(`${error.name}: ${error.message}`);
    const frame = error.stack?.split('\n').slice(1, 4).join('\n');
    if (frame) lines.push(frame);
  } else if (!isAxiosError(error)) {
    lines.push(String(error));
  }
  return lines.join('\n');
}
