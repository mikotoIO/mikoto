import { atom, useAtom, useAtomValue } from 'jotai';
import { useEffect, useLayoutEffect } from 'react';
import { z } from 'zod';

import { LocalDB } from '@/store/LocalDB';

/*
 * Appearance preferences. Every visual customization a user can make lives
 * here, and is applied to <html> as data attributes + two custom properties.
 * See tokens.css for what each attribute controls.
 */

const HEX = /^#[0-9a-f]{6}$/i;

export const ACCENT_PRESETS = [
  { name: 'Periwinkle', value: '#7C8CF8' },
  { name: 'Iris', value: '#A78BFA' },
  { name: 'Tide', value: '#4AB3E0' },
  { name: 'Moss', value: '#5CC98A' },
  { name: 'Ember', value: '#FF8A5B' },
  { name: 'Rose', value: '#F27BB0' },
] as const;

export const FONT_OPTIONS = [
  { value: 'inter', label: 'Inter' },
  { value: 'plex', label: 'IBM Plex' },
  { value: 'atkinson', label: 'Atkinson' },
  { value: 'onest', label: 'Onest' },
  { value: 'system', label: 'System' },
] as const;

export const DEFAULT_APPEARANCE = {
  theme: 'dark',
  accent: '#7C8CF8',
  tint: 'neutral',
  density: 'comfortable',
  radius: 'soft',
  font: 'inter',
  textSize: 14,
  spaceColors: true,
  roleStyle: 'color',
  reduceMotion: false,
} as const;

// Each field falls back to its default independently, so a stale or partly
// corrupt stored value never resets the user's other choices.
export const appearanceSchema = z.object({
  theme: z.enum(['dark', 'light', 'system']).catch(DEFAULT_APPEARANCE.theme),
  accent: z.string().regex(HEX).catch(DEFAULT_APPEARANCE.accent),
  tint: z.enum(['neutral', 'subtle', 'rich']).catch(DEFAULT_APPEARANCE.tint),
  density: z.enum(['comfortable', 'compact']).catch(DEFAULT_APPEARANCE.density),
  radius: z.enum(['sharp', 'soft', 'round']).catch(DEFAULT_APPEARANCE.radius),
  font: z
    .enum(['inter', 'plex', 'atkinson', 'onest', 'system'])
    .catch(DEFAULT_APPEARANCE.font),
  textSize: z.number().int().min(12).max(18).catch(DEFAULT_APPEARANCE.textSize),
  /** Let a space's own accent replace the user's while inside that space. */
  spaceColors: z.boolean().catch(DEFAULT_APPEARANCE.spaceColors),
  /** How space roles are shown on names: colored names or neutral names + tag. */
  roleStyle: z.enum(['color', 'tag']).catch(DEFAULT_APPEARANCE.roleStyle),
  reduceMotion: z.boolean().catch(DEFAULT_APPEARANCE.reduceMotion),
});

export type Appearance = z.infer<typeof appearanceSchema>;

function initialAppearance(): Appearance {
  // Carry over the accent from the legacy `theme` LocalDB, if any.
  try {
    const legacy = JSON.parse(localStorage.getItem('theme') ?? 'null');
    const accent = z
      .object({ accent: z.string().regex(HEX) })
      .safeParse(legacy);
    if (accent.success && accent.data.accent.toLowerCase() !== '#3b83ff') {
      return { ...DEFAULT_APPEARANCE, accent: accent.data.accent };
    }
  } catch {
    // ignore unreadable legacy data
  }
  return DEFAULT_APPEARANCE;
}

export const appearanceDB = new LocalDB(
  'appearance',
  appearanceSchema,
  initialAppearance,
);

const appearanceBaseAtom = atom<Appearance>(appearanceDB.get());

/** Read/write the user's appearance preferences (persisted). */
export const appearanceAtom = atom(
  (get) => get(appearanceBaseAtom),
  (get, set, update: Partial<Appearance>) => {
    const next = appearanceSchema.parse({
      ...get(appearanceBaseAtom),
      ...update,
    });
    set(appearanceBaseAtom, next);
    appearanceDB.set(next);
  },
);

export function useAppearance() {
  return useAtom(appearanceAtom);
}

/**
 * The accent of the space the user is currently looking at (the focused
 * tab's space), or null on Home / outside a space. Set by the app shell.
 */
export const activeSpaceAccentAtom = atom<string | null>(null);

/** The accent actually in effect, after space colors are considered. */
export function effectiveAccent(
  appearance: Appearance,
  spaceAccent: string | null,
): string {
  if (appearance.spaceColors && spaceAccent && HEX.test(spaceAccent)) {
    return spaceAccent;
  }
  return appearance.accent;
}

function resolveTheme(theme: Appearance['theme']): 'dark' | 'light' {
  if (theme !== 'system') return theme;
  return window.matchMedia('(prefers-color-scheme: light)').matches
    ? 'light'
    : 'dark';
}

function relativeLuminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Text color that stays legible on top of `hex`. */
export function onColor(hex: string): string {
  return relativeLuminance(hex) > 0.32 ? '#14121C' : '#FFFFFF';
}

export function applyAppearance(
  appearance: Appearance,
  spaceAccent: string | null = null,
) {
  const root = document.documentElement;
  const accent = effectiveAccent(appearance, spaceAccent);
  const theme = resolveTheme(appearance.theme);
  root.dataset.theme = theme;
  root.dataset.tint = appearance.tint;
  root.dataset.density = appearance.density;
  root.dataset.radius = appearance.radius;
  root.dataset.font = appearance.font;
  root.dataset.motion = appearance.reduceMotion ? 'reduce' : 'full';
  root.dataset.roles = appearance.roleStyle;
  root.style.setProperty('--accent', accent);
  root.style.setProperty('--on-accent', onColor(accent));
  root.style.setProperty('--fs', `${appearance.textSize}px`);
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', theme === 'dark' ? '#0e0f11' : '#d8dadf');
}

/** Keeps <html> in sync with preferences. Mount once near the app root. */
export function AppearanceRoot() {
  const appearance = useAtomValue(appearanceAtom);
  const spaceAccent = useAtomValue(activeSpaceAccentAtom);

  useLayoutEffect(() => {
    applyAppearance(appearance, spaceAccent);
  }, [appearance, spaceAccent]);

  useEffect(() => {
    if (appearance.theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: light)');
    const onChange = () => applyAppearance(appearance, spaceAccent);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [appearance, spaceAccent]);

  return null;
}

/** Inline style that gives an element a role color (see role.module.css). */
export function roleStyle(color: string | null | undefined) {
  return color ? { '--role': color } : undefined;
}
