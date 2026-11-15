import { AxiosError, AxiosHeaders } from 'axios';
import { describe, expect, test, vi } from 'vitest';
import { z } from 'zod';

import { ZSchema } from '../helpers/ZSchema';
import { formatEmoji, parseEmoji, parseEmojiHref } from '../helpers/emoji';
import { isAuthError, isTransientError, retry, sleep } from '../helpers/retry';
import { tokenExpiry } from '../helpers/token';

function httpError(status?: number) {
  const config = { headers: new AxiosHeaders() };
  return new AxiosError(
    'err',
    undefined,
    config,
    undefined,
    status === undefined
      ? undefined
      : { status, statusText: '', headers: {}, config, data: null },
  );
}

describe('error classification', () => {
  test.each([
    [undefined, true],
    [408, true],
    [429, true],
    [500, true],
    [503, true],
    [400, false],
    [401, false],
    [404, false],
  ])('status %s transient=%s', (status, transient) => {
    expect(isTransientError(httpError(status))).toBe(transient);
  });

  test('auth errors are 401 and 403 only', () => {
    expect(isAuthError(httpError(401))).toBe(true);
    expect(isAuthError(httpError(403))).toBe(true);
    expect(isAuthError(httpError(404))).toBe(false);
    expect(isAuthError(httpError())).toBe(false);
  });

  test('non-axios errors are neither', () => {
    expect(isTransientError(new Error('x'))).toBe(false);
    expect(isAuthError(new Error('x'))).toBe(false);
  });
});

describe('retry', () => {
  test('gives up after maxAttempts', async () => {
    const fn = vi.fn(async (_attempt: number) => {
      throw httpError(503);
    });
    const onRetry = vi.fn();
    await expect(
      retry(fn, { maxAttempts: 3, baseMs: 1, onRetry }),
    ).rejects.toBeInstanceOf(AxiosError);
    expect(fn).toHaveBeenCalledTimes(3);
    expect(onRetry).toHaveBeenCalledTimes(2);
    expect(fn.mock.calls.map((c) => c[0])).toEqual([0, 1, 2]);
  });

  test('custom shouldRetry overrides the default', async () => {
    let calls = 0;
    const result = await retry(
      async () => {
        if (++calls < 2) throw new Error('plain error');
        return 'done';
      },
      { baseMs: 1, shouldRetry: () => true },
    );
    expect(result).toBe('done');
  });

  test('stops when the signal aborts during the wait', async () => {
    const controller = new AbortController();
    const fn = vi.fn(async () => {
      throw httpError(503);
    });
    const promise = retry(fn, {
      baseMs: 60_000,
      signal: controller.signal,
    });
    await Promise.resolve();
    controller.abort();
    await expect(promise).rejects.toBeInstanceOf(AxiosError);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe('sleep', () => {
  test('resolves immediately for an already aborted signal', async () => {
    const controller = new AbortController();
    controller.abort();
    const start = Date.now();
    await sleep(60_000, controller.signal);
    expect(Date.now() - start).toBeLessThan(1000);
  });
});

describe('tokenExpiry', () => {
  const encode = (payload: unknown) =>
    btoa(JSON.stringify(payload))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

  test('decodes base64url payloads', () => {
    // '?>' encodes to characters that differ between base64 and base64url
    const token = `h.${encode({ exp: 2_000_000_000, sub: '??>>' })}.s`;
    expect(tokenExpiry(token)).toBe(2_000_000_000_000);
  });

  test('null when exp is missing or not a number', () => {
    expect(tokenExpiry(`h.${encode({ sub: 'x' })}.s`)).toBeNull();
    expect(tokenExpiry(`h.${encode({ exp: '123' })}.s`)).toBeNull();
    expect(tokenExpiry(`h.${encode(null)}.s`)).toBeNull();
    expect(tokenExpiry('h.!!!.s')).toBeNull();
    expect(tokenExpiry('')).toBeNull();
  });
});

describe('ZSchema', () => {
  class Point extends ZSchema(z.object({ x: z.number(), y: z.number() })) {}

  test('parse builds an instance of the subclass', () => {
    const p = Point.parse({ x: 1, y: 2 });
    expect(p).toBeInstanceOf(Point);
    expect(p).toMatchObject({ x: 1, y: 2 });
  });

  test('rejects invalid data', () => {
    expect(() => Point.parse({ x: 1, y: 'two' } as never)).toThrow();
  });

  test('strips unknown keys', () => {
    expect(Point.parse({ x: 1, y: 2, z: 3 } as never)).not.toHaveProperty('z');
  });
});

describe('emoji objects', () => {
  const id = '3f2a9c1e-0b7d-4c55-9a51-2d4e8f6a7b10';

  test('format and parse round-trip', () => {
    const text = formatEmoji({ id, name: 'party_parrot' });
    expect(text).toBe(`<emoji:${id}:party_parrot>`);
    expect(parseEmoji(text)).toEqual({ id, name: 'party_parrot' });
    expect(parseEmojiHref(`emoji:${id}:party_parrot`)).toEqual({
      id,
      name: 'party_parrot',
    });
  });

  test('rejects anything else', () => {
    for (const bad of [
      `<emoji:${id}>`,
      `<emoji:not-a-uuid:x>`,
      `<emoji:${id}:has space>`,
      `x<emoji:${id}:x>`,
      ':party_parrot:',
    ]) {
      expect(parseEmoji(bad)).toBeNull();
    }
  });
});
