import { autorun, makeAutoObservable, runInAction } from 'mobx';
import { createContext } from 'react';
import { atomFamily } from 'recoil';

type TabBaseType =
  | { kind: 'textChannel'; channelId: string }
  | { kind: 'voiceChannel'; channelId: string }
  | { kind: 'documentChannel'; channelId: string }
  | { kind: 'spaceSettings'; spaceId: string }
  | { kind: 'channelSettings'; channelId: string }
  | { kind: 'accountSettings' }
  | { kind: 'palette' }
  | { kind: 'welcome' }
  | { kind: 'unknown' };

export type Tabable = TabBaseType & {
  key: string;
};

export interface SurfaceLeaf {
  index: number;
  tabs: Tabable[];
}

export interface MultiSurface {
  direction: 'horizontal' | 'vertical';
  children: SurfaceNode[];
}

export type SurfaceNode = SurfaceLeaf | MultiSurface;

export class SurfaceStore {
  node: SurfaceLeaf;

  constructor() {
    this.node = {
      index: 0,
      tabs: [],
    };
    try {
      const storedJson = localStorage.getItem('surface');
      if (storedJson) {
        this.node = JSON.parse(storedJson);
      }
    } catch (_) {
      // ignore
    }
    makeAutoObservable(this);
    autorun(() => {
      localStorage.setItem('surface', JSON.stringify(this.node));
    });
  }
}

export const surfaceStore = new SurfaceStore();

export const tabNameFamily = atomFamily({
  key: 'tabName',
  default: {
    name: '',
  },
});

export const TabContext = createContext<{ key: string }>({
  key: '',
});

export function useTabkit() {
  function openNewChannel(ch: Tabable) {
    runInAction(() => {
      if (
        !surfaceStore.node.tabs.some(
          (x) => x.kind === ch.kind && x.key === ch.key,
        )
      ) {
        surfaceStore.node.tabs.push(ch);
      }
      surfaceStore.node.index = surfaceStore.node.tabs.length - 1;
      // toJS(surfaceStore.node);
    });
  }

  return {
    openNewChannel,
    openTab(tab: Tabable, openNew: boolean) {
      if (surfaceStore.node.tabs.length === 0) {
        openNewChannel(tab);
        return;
      }

      runInAction(() => {
        const idx = surfaceStore.node.tabs.findIndex(
          (n) => n.kind === tab.kind && n.key === tab.key,
        );
        if (idx !== -1) {
          surfaceStore.node.index = idx;
        } else if (openNew) {
          openNewChannel(tab);
        } else {
          surfaceStore.node.tabs[surfaceStore.node.index] = tab;
        }
      });
    },
  };
}
