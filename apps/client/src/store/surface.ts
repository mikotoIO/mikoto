import { action, autorun, makeAutoObservable, runInAction } from 'mobx';
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
  node: SurfaceNode;

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

export const pruneNode = action((node: SurfaceNode): SurfaceNode => {
  if ('tabs' in node) {
    return node;
  }
  if (node.children.length === 1) {
    return pruneNode(node.children[0]);
  }
  node.children = node.children.filter((x) => 'children' in x || x.tabs.length);
  return node;
});

function getFirstNode(node: SurfaceNode): SurfaceLeaf {
  if ('tabs' in node) {
    return node;
  }
  return getFirstNode(node.children[0]);
}

export const splitNode = action(() => {
  const node = getFirstNode(surfaceStore.node);

  const newSurface = {
    index: node.index,
    tabs: [...node.tabs],
  };

  if ('children' in surfaceStore.node) {
    surfaceStore.node.children.push(newSurface);
    return;
  }

  surfaceStore.node = {
    direction: 'horizontal',
    children: [
      {
        index: node.index,
        tabs: node.tabs,
      },
      newSurface,
    ],
  };
});

export function useTabkit() {
  const node = getFirstNode(surfaceStore.node);
  function openNewChannel(ch: Tabable) {
    runInAction(() => {
      if (!node.tabs.some((x) => x.kind === ch.kind && x.key === ch.key)) {
        node.tabs.push(ch);
      }
      node.index = node.tabs.length - 1;
    });
  }

  return {
    openNewChannel,
    openTab(tab: Tabable, openNew: boolean) {
      if (node.tabs.length === 0) {
        openNewChannel(tab);
        return;
      }

      runInAction(() => {
        const idx = node.tabs.findIndex(
          (n) => n.kind === tab.kind && n.key === tab.key,
        );
        if (idx !== -1) {
          node.index = idx;
        } else if (openNew) {
          openNewChannel(tab);
        } else {
          node.tabs[node.index] = tab;
        }
      });
    },
  };
}
