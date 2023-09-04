import { createContext } from "react";
import { atom, atomFamily, useRecoilState } from "recoil";
import { recoilPersist } from "recoil-persist";

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

type SurfaceNode = SurfaceLeaf | MultiSurface;

const tabPersist = recoilPersist({
  key: 'tabs',
});

export const tabbedState = atom<SurfaceLeaf>({
  key: 'tabbedChannels',
  default: {
    index: 0,
    tabs: [],
  },
  effects_UNSTABLE: [tabPersist.persistAtom],
});

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
  const [tabbed, setTabbed] = useRecoilState(tabbedState);

  function openNewChannel(ch: Tabable) {
    if (!tabbed.tabs.some((x) => x.kind === ch.kind && x.key === ch.key)) {
      setTabbed(({ index, tabs }) => ({
        index,
        tabs: [...tabs, ch],
      }));
    }
    setTabbed(({ tabs }) => ({
      index: tabbed.tabs.length,
      tabs,
    }));
  }

  return {
    openNewChannel,
    openTab(tab: Tabable, openNew: boolean) {
      if (tabbed.tabs.length === 0) {
        openNewChannel(tab);
        return;
      }

      const idx = tabbed.tabs.findIndex(
        (n) => n.kind === tab.kind && n.key === tab.key,
      );
      if (idx !== -1) {
        setTabbed(({ tabs }) => ({
          index: idx,
          tabs,
        }));
      } else if (openNew) {
        openNewChannel(tab);
      } else {
        setTabbed(({ tabs, index }) => {
          const xsn = [...tabs];
          xsn[index] = tab;
          return {
            index,
            tabs: xsn,
          };
        });
      }
    },
  };
}