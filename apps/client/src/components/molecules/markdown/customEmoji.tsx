import type { MikotoSpace } from '@mikoto-io/mikoto.js';
import { type ReactNode, createContext, use, useMemo } from 'react';
import { useSnapshot } from 'valtio/react';

import { normalizeMediaUrl } from '@/components/atoms/Avatar';
import { useMikoto } from '@/hooks';

/** A space's custom emoji, ready to render. */
export interface CustomEmoji {
  id: string;
  name: string;
  url: string;
}

export interface CustomEmojiSet {
  /** Oldest first, as the space lists them. */
  list: CustomEmoji[];
  /** By lowercased name, for `:name:` typed in the composer. */
  byName: ReadonlyMap<string, CustomEmoji>;
  byId: ReadonlyMap<string, CustomEmoji>;
  /** The space they belong to, for labelling them in the picker. */
  spaceName?: string;
}

const EMPTY: CustomEmojiSet = {
  list: [],
  byName: new Map(),
  byId: new Map(),
};

const CustomEmojiContext = createContext<CustomEmojiSet>(EMPTY);

/** The custom emoji usable here: the current space's, or none outside one. */
export function useCustomEmojis() {
  return use(CustomEmojiContext);
}

/**
 * Finds a custom emoji by id: the current space's first, then any other
 * space the user is in. Messages refer to emoji by id, so one from another
 * space still shows if we know it.
 */
export function useCustomEmojiById(id: string): CustomEmoji | undefined {
  const local = useCustomEmojis().byId.get(id);
  const mikoto = useMikoto();
  if (local) return local;
  for (const space of mikoto.spaces.values()) {
    const emoji = space.emojis._get(id);
    if (emoji) {
      return { id, name: emoji.name, url: normalizeMediaUrl(emoji.image) };
    }
  }
  return undefined;
}

export function buildCustomEmojiSet(
  emojis: Iterable<{ id: string; name: string; image: string }>,
  spaceName?: string,
): CustomEmojiSet {
  const list = Array.from(emojis, (e) => ({
    id: e.id,
    name: e.name,
    url: normalizeMediaUrl(e.image),
  }));
  return {
    list,
    byName: new Map(list.map((e) => [e.name.toLowerCase(), e])),
    byId: new Map(list.map((e) => [e.id, e])),
    spaceName,
  };
}

function SpaceEmojiProvider({
  space,
  children,
}: {
  space: MikotoSpace;
  children: ReactNode;
}) {
  const cache = useSnapshot(space.emojis.cache);
  const { name } = useSnapshot(space);
  const value = useMemo(
    () => buildCustomEmojiSet(cache.values(), name),
    [cache, name],
  );
  return <CustomEmojiContext value={value}>{children}</CustomEmojiContext>;
}

/** Makes `space`'s custom emoji available to messages, the picker and autocomplete. */
export function CustomEmojiProvider({
  space,
  children,
}: {
  space?: MikotoSpace;
  children: ReactNode;
}) {
  if (!space) {
    return <CustomEmojiContext value={EMPTY}>{children}</CustomEmojiContext>;
  }
  return <SpaceEmojiProvider space={space}>{children}</SpaceEmojiProvider>;
}
