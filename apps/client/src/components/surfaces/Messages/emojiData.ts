import { useEffect, useState } from 'react';
import { z } from 'zod';

import type { CustomEmoji } from '@/components/molecules/markdown';

/*
 * Twemoji data shared by the emoji picker and the `:shortcode` autocomplete.
 * Loaded lazily (the JSON is large) and cached for the session.
 */

const emojiDataSchema = z.object({
  categories: z.array(
    z.object({ id: z.string(), emojis: z.array(z.string()) }),
  ),
  emojis: z.record(
    z.string(),
    z.object({
      id: z.string(),
      name: z.string(),
      keywords: z.array(z.string()).optional(),
      skins: z
        .array(z.object({ native: z.string(), unified: z.string() }))
        .optional(),
    }),
  ),
});

export interface EmojiEntry {
  /** The shortcode: what `:id:` means in a message. */
  id: string;
  name: string;
  native: string;
  unified: string;
  keywords: string[];
  /** Unique across standard and custom emoji (a custom emoji may share a
   *  standard one's shortcode). Also what a reaction with it is keyed by. */
  key: string;
  /** Set for a space's custom emoji. */
  custom?: CustomEmoji;
}

export interface EmojiCategory {
  id: string;
  emojis: EmojiEntry[];
}

export interface EmojiSet {
  /** Every emoji, in category order. */
  list: EmojiEntry[];
  byId: Map<string, EmojiEntry>;
  categories: EmojiCategory[];
}

let cache: EmojiSet | null = null;
let loading: Promise<EmojiSet> | null = null;

export function getLoadedEmojis(): EmojiSet | null {
  return cache;
}

export function loadEmojis(): Promise<EmojiSet> {
  if (cache) return Promise.resolve(cache);
  loading ??= import('@emoji-mart/data/sets/14/twitter.json').then((mod) => {
    const parsed = emojiDataSchema.safeParse(mod.default);
    const byId = new Map<string, EmojiEntry>();
    const categories: EmojiCategory[] = [];
    if (parsed.success) {
      for (const e of Object.values(parsed.data.emojis)) {
        const skin = e.skins?.[0];
        if (!skin) continue;
        byId.set(e.id, {
          id: e.id,
          name: e.name,
          native: skin.native,
          unified: skin.unified,
          keywords: e.keywords ?? [],
          key: e.id,
        });
      }
      for (const c of parsed.data.categories) {
        const emojis = c.emojis.flatMap((id) => byId.get(id) ?? []);
        if (emojis.length) categories.push({ id: c.id, emojis });
      }
    }
    cache = {
      list: categories.flatMap((c) => c.emojis),
      byId,
      categories,
    };
    return cache;
  });
  return loading;
}

/** The standard emoji set, loading it on first use. */
export function useEmojiSet() {
  const [set, setSet] = useState<EmojiSet | null>(getLoadedEmojis);
  useEffect(() => {
    if (set) return;
    let cancelled = false;
    void loadEmojis().then((s) => {
      if (!cancelled) setSet(s);
    });
    return () => {
      cancelled = true;
    };
  }, [set]);
  return set;
}

/** Ranked search: id prefix, then id substring, then keyword/name match. */
export function searchEmojis(
  emojis: EmojiEntry[],
  search: string,
  limit = Infinity,
): EmojiEntry[] {
  const q = search.trim().toLowerCase().replace(/^:|:$/g, '');
  if (!q) return [];
  const startsWith: EmojiEntry[] = [];
  const idIncludes: EmojiEntry[] = [];
  const other: EmojiEntry[] = [];
  for (const e of emojis) {
    if (e.id.startsWith(q)) {
      startsWith.push(e);
    } else if (e.id.includes(q)) {
      idIncludes.push(e);
    } else if (
      e.name.toLowerCase().includes(q) ||
      e.keywords.some((k) => k.includes(q))
    ) {
      other.push(e);
    }
    if (startsWith.length >= limit) break;
  }
  return [...startsWith, ...idIncludes, ...other].slice(0, limit);
}

/** Picker/autocomplete entries for a space's custom emoji. */
export function customEmojiEntries(emojis: CustomEmoji[]): EmojiEntry[] {
  return emojis.map((custom) => ({
    id: custom.name,
    name: custom.name.replaceAll('_', ' '),
    native: `:${custom.name}:`,
    unified: '',
    keywords: [],
    key: custom.id,
    custom,
  }));
}

/** The same Twemoji images messages render (see markdown/EmojiElement). */
export function emojiImageUrl(e: Pick<EmojiEntry, 'unified' | 'custom'>) {
  if (e.custom) return e.custom.url;
  return `https://cdn.jsdelivr.net/npm/emoji-datasource-twitter@15.0.1/img/twitter/64/${e.unified}.png`;
}
