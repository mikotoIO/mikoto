import { AxiosError, AxiosHeaders } from 'axios';
import { afterEach, describe, expect, test, vi } from 'vitest';

import { describeError } from './errors';

function httpError(status: number, data: unknown = null) {
  const config = { headers: new AxiosHeaders(), method: 'post', url: '/x' };
  return new AxiosError('Request failed', 'ERR_BAD_RESPONSE', config, null, {
    status,
    statusText: 'Status',
    headers: {},
    config,
    data,
  });
}

function networkError() {
  return new AxiosError('Network Error', 'ERR_NETWORK', {
    headers: new AxiosHeaders(),
    url: '/y',
  });
}

function setOnline(onLine: boolean) {
  vi.stubGlobal('navigator', { onLine });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('describeError (load)', () => {
  test.each([
    [401, false, /session expired/],
    [403, false, /permission/],
    [404, false, /deleted/],
    [429, true, /Too many requests/],
    [500, true, /server ran into a problem/],
    [503, true, /server ran into a problem/],
  ])('HTTP %i', (status, retryable, message) => {
    const result = describeError(httpError(status));
    expect(result.status).toBe(status);
    expect(result.retryable).toBe(retryable);
    expect(result.message).toMatch(message);
  });

  test('other 4xx uses the server message when present', () => {
    expect(
      describeError(httpError(400, { message: 'Bad name' })),
    ).toMatchObject({ message: 'Bad name', retryable: false, status: 400 });
    expect(describeError(httpError(400)).message).toBe(
      'The request was rejected.',
    );
  });

  test('ignores overly long or non-string server messages', () => {
    expect(
      describeError(httpError(400, { message: 'x'.repeat(500) })).message,
    ).toBe('The request was rejected.');
    expect(describeError(httpError(400, { message: 42 })).message).toBe(
      'The request was rejected.',
    );
  });

  test('no response while online', () => {
    setOnline(true);
    const result = describeError(networkError());
    expect(result.retryable).toBe(true);
    expect(result.message).toMatch(/Couldn't reach the server/);
    expect(result.status).toBeUndefined();
  });

  test('no response while offline', () => {
    setOnline(false);
    expect(describeError(networkError()).message).toMatch(/offline/);
  });

  test('non-request errors are treated as crashes', () => {
    expect(describeError(new TypeError('x is undefined'))).toMatchObject({
      message: 'Part of the app crashed while showing this.',
      retryable: true,
    });
  });
});

describe('describeError (action)', () => {
  const action = { context: 'action' } as const;

  test('prefers the server explanation for 4xx', () => {
    expect(
      describeError(httpError(409, { message: 'Name taken' }), action),
    ).toMatchObject({ message: 'Name taken', retryable: false, status: 409 });
  });

  test('does not surface server text for 429', () => {
    const result = describeError(
      httpError(429, { message: 'slow down' }),
      action,
    );
    expect(result.message).toMatch(/Too many requests/);
    expect(result.retryable).toBe(true);
  });

  test('401 without a server message means signed out', () => {
    expect(describeError(httpError(401), action).message).toMatch(/signed out/);
  });

  test('5xx falls through to the generic server message', () => {
    expect(
      describeError(httpError(500, { message: 'db exploded' }), action).message,
    ).toMatch(/server ran into a problem/);
  });

  test('passes through short error messages', () => {
    expect(describeError(new Error('Name is required'), action)).toMatchObject({
      message: 'Name is required',
      retryable: true,
    });
    expect(describeError('Pick a file first', action).message).toBe(
      'Pick a file first',
    );
  });

  test('falls back for long or empty messages', () => {
    const fallback = 'The app hit an unexpected problem. Try again.';
    expect(describeError(new Error('x'.repeat(300)), action).message).toBe(
      fallback,
    );
    expect(describeError(new Error(''), action).message).toBe(fallback);
    expect(describeError({ weird: true }, action).message).toBe(fallback);
  });
});

describe('describeError details', () => {
  test('include request line and status for HTTP errors', () => {
    const { details } = describeError(httpError(404));
    expect(details).toContain('POST /x');
    expect(details).toContain('404 Status');
    expect(details).toContain('AxiosError: Request failed');
  });

  test('include the error code when there was no response', () => {
    setOnline(true);
    const { details } = describeError(networkError());
    expect(details).toContain('GET /y');
    expect(details).toContain('No response (ERR_NETWORK)');
  });

  test('stringify non-Error values', () => {
    expect(describeError('plain').details).toBe('plain');
    expect(describeError(42).details).toBe('42');
  });
});
