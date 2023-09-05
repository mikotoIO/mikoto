import { Space } from 'mikotojs';
import React, { createContext } from 'react';
import { atom, atomFamily, useRecoilState, useSetRecoilState } from 'recoil';
import { recoilPersist } from 'recoil-persist';

import { modalState } from '../components/ContextMenu';

// spaceId, not space
const spaceIdPersist = recoilPersist({
  key: 'spaceId',
});

export const treebarSpaceState = atom<string | null>({
  key: 'treebarSpace',
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
export const CurrentSpaceContext = React.createContext<Space | undefined>(
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
