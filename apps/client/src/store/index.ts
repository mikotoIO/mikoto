import { MikotoSpace } from '@mikoto-io/mikoto.js';
import React from 'react';
import { atom, useSetAtom } from 'jotai';
import { atomWithStorage } from 'jotai/vanilla/utils';
import { z } from 'zod';

import { modalState } from '@/components/ContextMenu';

import { LocalDB } from './LocalDB';
import { Tabable } from './surface';

export const treebarSpaceState = atomWithStorage<Tabable | null>('leftSidebar', null);

// surface systems

export function useModalKit() {
  const set = useSetAtom(modalState);
  const w = (elem: React.ReactNode) => {
    set({ elem });
  };
  return w;
}

// some local contexts
export const CurrentSpaceContext = React.createContext<MikotoSpace | undefined>(
  undefined,
);

export const rightBarOpenState = atom<boolean>(false);

interface Workspace {
  left: number;
  leftOpen: boolean;
  right: number;
  rightOpen: boolean;
}

export const workspaceState = atomWithStorage<Workspace>('workspace', {
  left: 300,
  leftOpen: true,
  right: 300,
  rightOpen: true,
});

// online status

export const onlineState = atom<boolean>(true);

export const DEFAULT_THEME_SETTINGS = {
  theme: 'dark',
  accent: '#3b83ff',
};

export const themeDB = new LocalDB(
  'theme',
  z.object({
    theme: z.enum(['dark', 'light']),
    accent: z.string().regex(/^#[0-9a-f]{6}$/i),
  }),
  () => DEFAULT_THEME_SETTINGS,
);
