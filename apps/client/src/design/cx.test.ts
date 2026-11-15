import { describe, expect, test } from 'vitest';

import { cx } from './cx';
import { spaceAccent } from './space';

describe('cx', () => {
  test('joins truthy class names', () => {
    expect(cx('a', 'b', 'c')).toBe('a b c');
  });

  test('skips falsy values', () => {
    expect(cx('a', false, null, undefined, '', 'b')).toBe('a b');
    expect(cx()).toBe('');
  });
});

describe('spaceAccent', () => {
  test('returns a valid hex accent', () => {
    expect(spaceAccent({ accent: '#A1b2C3' })).toBe('#A1b2C3');
  });

  test('rejects missing or malformed accents', () => {
    expect(spaceAccent(null)).toBeNull();
    expect(spaceAccent(undefined)).toBeNull();
    expect(spaceAccent({})).toBeNull();
    expect(spaceAccent({ accent: null })).toBeNull();
    expect(spaceAccent({ accent: 'red' })).toBeNull();
    expect(spaceAccent({ accent: '#fff' })).toBeNull();
    expect(spaceAccent({ accent: '#1234567' })).toBeNull();
    expect(spaceAccent({ accent: 0x123456 })).toBeNull();
  });
});
