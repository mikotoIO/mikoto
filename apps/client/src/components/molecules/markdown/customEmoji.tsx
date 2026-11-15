import type { MikotoSpace } from '@mikoto-io/mikoto.js';
import { type ReactNode, createContext, use, useMemo } from 'react';
import { useSnapshot } from 'valtio/react';

import { normalizeMediaUrl } from '@/components/atoms/Avatar';

/** A space's custom emoji, ready to render. */
export interface CustomEmoji {
  id: string;
  name: string;
  url: string;
}

export interface CustomEmojiSet {
  /** Oldest first, as the space lists them. */
  list: CustomEmoji[];
  /** By lowercased name, which is how `:name:` resolves. */
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
