import { beforeEach, describe, expect, test, vi } from 'vitest';

import { MemoryStorage } from '@/test/memoryStorage';

// appearance.ts reads localStorage at import time, so stub it before a
// dynamic import.
vi.stubGlobal('localStorage', new MemoryStorage());

const {
  DEFAULT_APPEARANCE,
  appearanceDB,
  appearanceSchema,
  effectiveAccent,
  onColor,
  roleStyle,
} = await import('./appearance');

beforeEach(() => {
  vi.stubGlobal('localStorage', new MemoryStorage());
});

describe('appearanceSchema', () => {
  test('accepts a valid appearance unchanged', () => {
    const valid = {
      ...DEFAULT_APPEARANCE,
      theme: 'light',
      accent: '#123abc',
      textSize: 16,
    };
    expect(appearanceSchema.parse(valid)).toEqual(valid);
  });

  test('fills a missing value with defaults', () => {
    expect(appearanceSchema.parse({})).toEqual(DEFAULT_APPEARANCE);
  });

  test('falls back per field, keeping other valid choices', () => {
    const parsed = appearanceSchema.parse({
      ...DEFAULT_APPEARANCE,
      theme: 'light',
      accent: 'not-a-color',
      font: 'comic-sans',
      textSize: 99,
      reduceMotion: 'yes',
    });
    expect(parsed).toEqual({
      ...DEFAULT_APPEARANCE,
      theme: 'light',
    });
  });

  test('textSize must be an integer in range', () => {
    const size = (textSize: unknown) =>
      appearanceSchema.parse({ textSize }).textSize;
    expect(size(12)).toBe(12);
    expect(size(18)).toBe(18);
    expect(size(11)).toBe(DEFAULT_APPEARANCE.textSize);
    expect(size(14.5)).toBe(DEFAULT_APPEARANCE.textSize);
  });
});

describe('effectiveAccent', () => {
  const base = appearanceSchema.parse({ accent: '#111111' });

  test("uses the space's accent when space colors are on", () => {
    expect(effectiveAccent(base, '#222222')).toBe('#222222');
  });

  test("uses the user's accent otherwise", () => {
    expect(effectiveAccent(base, null)).toBe('#111111');
    expect(effectiveAccent(base, 'bogus')).toBe('#111111');
    expect(effectiveAccent({ ...base, spaceColors: false }, '#222222')).toBe(
      '#111111',
    );
  });
});

describe('onColor', () => {
  test('dark text on light colors, white text on dark colors', () => {
    expect(onColor('#FFFFFF')).toBe('#14121C');
    expect(onColor('#F2E94E')).toBe('#14121C');
    expect(onColor('#000000')).toBe('#FFFFFF');
    expect(onColor('#3B3BD4')).toBe('#FFFFFF');
  });

  test('every accent preset gets a deterministic text color', () => {
    for (const hex of ['#7C8CF8', '#A78BFA', '#4AB3E0', '#5CC98A']) {
      expect(['#14121C', '#FFFFFF']).toContain(onColor(hex));
    }
  });
});

describe('roleStyle', () => {
  test('sets the --role custom property only when a color is given', () => {
    expect(roleStyle('#ff0000')).toEqual({ '--role': '#ff0000' });
    expect(roleStyle(null)).toBeUndefined();
    expect(roleStyle(undefined)).toBeUndefined();
    expect(roleStyle('')).toBeUndefined();
  });
});

describe('initial appearance', () => {
  test('defaults without legacy data', () => {
    expect(appearanceDB.init()).toEqual(DEFAULT_APPEARANCE);
  });

  test('carries over a custom accent from the legacy theme store', () => {
    localStorage.setItem('theme', JSON.stringify({ accent: '#abcdef' }));
    expect(appearanceDB.init()).toEqual({
      ...DEFAULT_APPEARANCE,
      accent: '#abcdef',
    });
  });

  test('ignores the old default accent and unreadable data', () => {
    localStorage.setItem('theme', JSON.stringify({ accent: '#3B83FF' }));
    expect(appearanceDB.init()).toEqual(DEFAULT_APPEARANCE);
    localStorage.setItem('theme', '{not json');
    expect(appearanceDB.init()).toEqual(DEFAULT_APPEARANCE);
  });
});
