import { describe, expect, test } from 'vitest';

import { checkPermission, permissions } from '.';

describe('permissions', () => {
  test('every permission is a distinct single bit', () => {
    const values = Object.values(permissions);
    expect(new Set(values).size).toBe(values.length);
    for (const value of values) {
      expect(value > 0n).toBe(true);
      expect(value & (value - 1n)).toBe(0n);
    }
  });

  test('bits are contiguous from 0', () => {
    const combined = Object.values(permissions).reduce((a, b) => a | b, 0n);
    expect(combined).toBe((1n << BigInt(Object.keys(permissions).length)) - 1n);
  });
});

describe('checkPermission', () => {
  const perms = permissions.manageChannels | permissions.ban;

  test('accepts bigint permission sets', () => {
    expect(checkPermission(permissions.manageChannels, perms)).toBe(true);
    expect(checkPermission(permissions.ban, perms)).toBe(true);
    expect(checkPermission(permissions.manageRoles, perms)).toBe(false);
  });

  test('accepts decimal string permission sets, as the API sends them', () => {
    expect(checkPermission(permissions.ban, perms.toString())).toBe(true);
    expect(checkPermission(permissions.superuser, perms.toString())).toBe(
      false,
    );
    expect(checkPermission(permissions.ban, '0')).toBe(false);
  });

  test('handles bits beyond the 53-bit float range', () => {
    const high = 1n << 60n;
    expect(checkPermission(high, (high | 1n).toString())).toBe(true);
    expect(checkPermission(high, '1')).toBe(false);
  });

  test('a multi-bit rule passes if any bit is set', () => {
    const rule = permissions.manageSpace | permissions.manageRoles;
    expect(checkPermission(rule, permissions.manageRoles)).toBe(true);
    expect(checkPermission(rule, permissions.ban)).toBe(false);
  });

  test('throws on a malformed string', () => {
    expect(() => checkPermission(permissions.ban, 'abc')).toThrow();
  });
});
