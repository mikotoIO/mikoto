import { beforeEach, describe, expect, test, vi } from 'vitest';
import { z } from 'zod';

import { MemoryStorage } from '@/test/memoryStorage';

import { LocalDB } from './LocalDB';

const schema = z.object({ count: z.number() });

beforeEach(() => {
  vi.stubGlobal('localStorage', new MemoryStorage());
});

describe('LocalDB', () => {
  test('writes the initial value when the key is empty', () => {
    new LocalDB('k', schema, () => ({ count: 1 }));
    expect(JSON.parse(localStorage.getItem('k')!)).toEqual({ count: 1 });
  });

  test('keeps an existing value', () => {
    localStorage.setItem('k', JSON.stringify({ count: 5 }));
    const db = new LocalDB('k', schema, () => ({ count: 1 }));
    expect(db.get()).toEqual({ count: 5 });
  });

  test('falls back to init for corrupt or invalid data', () => {
    const db = new LocalDB('k', schema, () => ({ count: 1 }));
    localStorage.setItem('k', '{not json');
    expect(db.get()).toEqual({ count: 1 });
    localStorage.setItem('k', JSON.stringify({ count: 'many' }));
    expect(db.get()).toEqual({ count: 1 });
    localStorage.removeItem('k');
    expect(db.get()).toEqual({ count: 1 });
  });

  test('set accepts a value or an updater', () => {
    const db = new LocalDB('k', schema, () => ({ count: 1 }));
    db.set({ count: 2 });
    expect(db.get()).toEqual({ count: 2 });
    db.set((prev) => ({ count: prev.count + 10 }));
    expect(db.get()).toEqual({ count: 12 });
  });

  test('set validates before writing', () => {
    const db = new LocalDB('k', schema, () => ({ count: 1 }));
    expect(() => db.set({ count: 'x' } as never)).toThrow();
    expect(db.get()).toEqual({ count: 1 });
  });

  test('schema defaults are applied on read', () => {
    const withDefault = z.object({ name: z.string().catch('anon') });
    localStorage.setItem('k', JSON.stringify({ name: 7 }));
    const db = new LocalDB('k', withDefault, () => ({ name: 'init' }));
    expect(db.get()).toEqual({ name: 'anon' });
  });
});
