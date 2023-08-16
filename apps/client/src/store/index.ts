import { Channel, Space } from 'mikotojs';
import React, { createContext } from 'react';
import { atom, atomFamily, useRecoilState } from 'recoil';
import { recoilPersist } from 'recoil-persist';

export const treebarSpaceState = atom<Space | null>({
  key: 'treebarSpace',
  default: null,
  dangerouslyAllowMutability: true, // we like to live dangerously
});

// TODO: stop putting full objects in here
type TabBaseType =
  | { kind: 'textChannel'; channel: Channel }
  | { kind: 'voiceChannel'; channel: Channel }
  | { kind: 'spaceSettings'; spaceId: string }
  | { kind: 'channelSettings'; channelId: string }
  | { kind: 'accountSettings' }
  | { kind: 'palette' }
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
