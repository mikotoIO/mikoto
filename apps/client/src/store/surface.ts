import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { atom, useAtom, useAtomValue, useSetAtom } from 'jotai';
import { atomFamily } from 'jotai/utils';
import { createContext } from 'react';

import type { TabBaseType } from '@/components/surfaces';

export type Tabable = TabBaseType & {
  key: string;
};

export interface DockViewLayout {
  layout: string;
  activeGroup?: string;
}

// Jotai atoms for tab state
export const tabsState = atom<Tabable[]>([]);

export const layoutState = atom<DockViewLayout | null>(null);

export const activeTabIdState = atom<string | null>(null);

// Derived atom to get a tab by ID
export const tabByIdSelector = atom((get) => (id: string) => {
  const tabs = get(tabsState);
  const [kind, key] = id.split('/');
  return tabs.find((tab) => tab.kind === kind && tab.key === key);
});

export interface TabNameProps {
  name: string;
  icon?: IconDefinition | string;
  spaceId?: string;
  spaceName?: string;
}

export const tabNameFamily = atomFamily((param: string) =>
  atom<TabNameProps>({
    name: '',
  }),
);

export const TabContext = createContext<{ key: string }>({
  key: '',
});

export function useTabkit() {
  const [tabs, setTabs] = useAtom(tabsState);
  const [activeTabId, setActiveTabId] = useAtom(activeTabIdState);
  const getTabById = useAtomValue(tabByIdSelector);

  // Storage functions removed temporarily
  const saveTabsToStorage = (_newTabs: Tabable[]) => {
    // Removed localStorage persistence
  };

  const saveActiveTabToStorage = (_tabId: string | null) => {
    // Removed localStorage persistence
  };

  function openNewChannel(ch: Tabable) {
    const newTabs = [...tabs, ch];
    setTabs(newTabs);
    saveTabsToStorage(newTabs);

    const tabId = `${ch.kind}/${ch.key}`;
    setActiveTabId(tabId);
    saveActiveTabToStorage(tabId);
  }

  return {
    openNewChannel,
    getTabs() {
      return tabs;
    },
    openTab(tab: Tabable, openNew: boolean = false) {
      const tabId = `${tab.kind}/${tab.key}`;
      const existingTab = getTabById(tabId);

      if (existingTab) {
        setActiveTabId(tabId);
        saveActiveTabToStorage(tabId);
      } else if (tabs.length === 0 || openNew) {
        openNewChannel(tab);
      } else {
        const newTabs = [...tabs, tab];
        setTabs(newTabs);
        saveTabsToStorage(newTabs);
        setActiveTabId(tabId);
        saveActiveTabToStorage(tabId);
      }
    },
    removeTab(id: string) {
      const [kind, key] = id.split('/');
      const newTabs = tabs.filter(
        (tab) => !(tab.kind === kind && tab.key === key),
      );
      setTabs(newTabs);
      saveTabsToStorage(newTabs);

      // If we just removed the active tab, reset activeTabId if there are no tabs left
      if (activeTabId === id && newTabs.length === 0) {
        setActiveTabId(null);
        saveActiveTabToStorage(null);
      }
    },
    setActiveTab(id: string) {
      setActiveTabId(id);
      saveActiveTabToStorage(id);
    },
    updateLayout(_layout: DockViewLayout) {
      // Removed localStorage persistence
    },
  };
}

// Helper function to get tabs for components that were previously using surfaceStore directly
export function useTabs() {
  return useAtomValue(tabsState);
}

export function useActiveTabId() {
  return useAtomValue(activeTabIdState);
}

export function useLayout() {
  return useAtomValue(layoutState);
}
