import { atom, useRecoilState } from 'recoil';
import { Channel, Space } from '../models';

export const treebarSpaceState = atom<Space | null>({
  key: 'treebarSpace',
  default: null,
});

type TabBaseType =
  | { kind: 'textChannel'; channel: Channel }
  | { kind: 'voiceChannel'; channel: Channel }
  | { kind: 'spaceSettings'; space: Space }
  | { kind: 'accountSettings' }
  | { kind: 'unknown' };

export type Tabable = TabBaseType & {
  key: string;
  name: string;
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
