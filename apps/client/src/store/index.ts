import { MikotoSpace } from '@mikoto-io/mikoto.js';
import React from 'react';
import { atom, useSetRecoilState } from 'recoil';
import { recoilPersist } from 'recoil-persist';
import { z } from 'zod';

import { modalState } from '@/components/ContextMenu';

import { LocalDB } from './LocalDB';
import { Tabable } from './surface';

// spaceId, not space
const spaceIdPersist = recoilPersist({
  key: 'leftSidebar',
});

export const treebarSpaceState = atom<Tabable | null>({
  key: 'leftSidebar',
  default: null,
  dangerouslyAllowMutability: true, // we like to live dangerously
  effects_UNSTABLE: [spaceIdPersist.persistAtom],
});

// surface systems

export function useModalKit() {
  const set = useSetRecoilState(modalState);
  const w = (elem: React.ReactNode) => {
    set({ elem });
  };
  return w;
}

// some local contexts
export const CurrentSpaceContext = React.createContext<MikotoSpace | undefined>(
  undefined,
);

export const rightBarOpenState = atom<boolean>({
  key: 'rightBarOpen',
  default: false,
});

interface Workspace {
  left: number;
  leftOpen: boolean;
  right: number;
  rightOpen: boolean;
}

const workspacePersist = recoilPersist({
  key: 'workspace',
});

export const workspaceState = atom<Workspace>({
  key: 'workspace',
  default: {
    left: 300,
    leftOpen: true,
    right: 300,
    rightOpen: true,
  },
  effects_UNSTABLE: [workspacePersist.persistAtom],
});

// online status

export const onlineState = atom<boolean>({
  key: 'online',
  default: true,
});

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
