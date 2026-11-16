import { describe, expect, test } from 'vitest';

import {
  checkPermission,
  isBuiltinPermission,
  isCustomPermission,
  normalizePermissions,
  permissions,
  setPermission,
} from '.';

describe('permissions', () => {
  test('every permission has a distinct name', () => {
    const values = Object.values(permissions);
    expect(new Set(values).size).toBe(values.length);
  });

  test('built-in names are snake_case and never look custom', () => {
    for (const value of Object.values(permissions)) {
      expect(value).toMatch(/^[a-z]+(_[a-z]+)*$/);
      expect(isCustomPermission(value)).toBe(false);
      expect(isBuiltinPermission(value)).toBe(true);
    }
  });
});

describe('isCustomPermission', () => {
  test.each(['polls:create', 'my-ext.v2:do_thing', 'a:b'])('%s', (name) => {
    expect(isCustomPermission(name)).toBe(true);
  });

  test.each([
    'polls',
    'polls:',
    ':create',
    'Polls:create',
    'polls:cre ate',
    'a:b:c',
    `x:${'y'.repeat(64)}`,
  ])('rejects %j', (name) => {
    expect(isCustomPermission(name)).toBe(false);
  });
});

describe('checkPermission', () => {
  const held = [permissions.manageChannels, permissions.ban, 'polls:create'];

  test('checks single permissions', () => {
    expect(checkPermission(permissions.manageChannels, held)).toBe(true);
    expect(checkPermission(permissions.ban, held)).toBe(true);
    expect(checkPermission('polls:create', held)).toBe(true);
    expect(checkPermission(permissions.manageRoles, held)).toBe(false);
    expect(checkPermission('polls:close', held)).toBe(false);
  });

  test('a list of rules needs every one, as on the server', () => {
    expect(
      checkPermission([permissions.manageChannels, permissions.ban], held),
    ).toBe(true);
    expect(
      checkPermission(
        [permissions.manageChannels, permissions.manageRoles],
        held,
      ),
    ).toBe(false);
    expect(checkPermission([], held)).toBe(true);
  });

  test("superuser isn't a bypass here", () => {
    expect(checkPermission(permissions.ban, [permissions.superuser])).toBe(
      false,
    );
  });

  test('accepts any iterable', () => {
    expect(checkPermission(permissions.ban, new Set(held))).toBe(true);
  });
});

describe('normalizePermissions', () => {
  test('orders built-ins canonically, then custom names, without duplicates', () => {
    expect(
      normalizePermissions([
        'zz:b',
        permissions.ban,
        'aa:a',
        permissions.superuser,
        permissions.ban,
      ]),
    ).toEqual([permissions.superuser, permissions.ban, 'aa:a', 'zz:b']);
  });

  test('setPermission toggles back to the same list', () => {
    const start = [permissions.manageSpace, permissions.ban, 'polls:create'];
    const off = setPermission(start, permissions.manageSpace, false);
    expect(off).toEqual([permissions.ban, 'polls:create']);
    expect(setPermission(off, permissions.manageSpace, true)).toEqual(start);
  });
});
