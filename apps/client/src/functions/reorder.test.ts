import { describe, expect, test } from 'vitest';

import { checkNonNull } from './assertNonNull';
import { reorder } from './reorder';

describe('reorder', () => {
  test('moves an element forward and backward', () => {
    expect(reorder(['a', 'b', 'c', 'd'], 0, 2)).toEqual(['b', 'c', 'a', 'd']);
    expect(reorder(['a', 'b', 'c', 'd'], 3, 1)).toEqual(['a', 'd', 'b', 'c']);
  });

  test('moving to the same index is a no-op', () => {
    expect(reorder(['a', 'b', 'c'], 1, 1)).toEqual(['a', 'b', 'c']);
  });

  test('does not mutate the input', () => {
    const input = ['a', 'b', 'c'];
    const output = reorder(input, 0, 2);
    expect(input).toEqual(['a', 'b', 'c']);
    expect(output).not.toBe(input);
  });
});

describe('checkNonNull', () => {
  test('passes values through, including falsy ones', () => {
    expect(checkNonNull(0)).toBe(0);
    expect(checkNonNull('')).toBe('');
    expect(checkNonNull(false)).toBe(false);
  });

  test('throws on null and undefined', () => {
    expect(() => checkNonNull(null)).toThrow(/null assertion failed/);
    expect(() => checkNonNull(undefined)).toThrow(/null assertion failed/);
  });
});
