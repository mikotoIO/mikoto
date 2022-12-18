import { ClientChannel, ClientSpace } from 'mikotojs';
import { createContext } from 'react';
import { atom, atomFamily, useRecoilState } from 'recoil';

export const treebarSpaceState = atom<ClientSpace | null>({
  key: 'treebarSpace',
  default: null,
  dangerouslyAllowMutability: true, // we like to live dangerously
});

type TabBaseType =
  | { kind: 'textChannel'; channel: ClientChannel }
  | { kind: 'voiceChannel'; channel: ClientChannel }
  | { kind: 'spaceSettings'; space: ClientSpace }
  | { kind: 'accountSettings' }
  | { kind: 'unknown' };

export type Tabable = TabBaseType & {
  key: string;
};

export const tabbedState = atom<{
  index: number;
  tabs: Tabable[];
}>({
  key: 'tabbedChannels',
  default: {
    index: 0,
    tabs: [],
  },
  dangerouslyAllowMutability: true, // we like to live dangerously
});

export const tabNameFamily = atomFamily({
  key: 'tabName',
  default: '',
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
