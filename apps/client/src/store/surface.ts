import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { IDockviewPanelHeaderProps, IGridviewPanelProps } from 'dockview-react';
import { createContext } from 'react';
import { atom, atomFamily, selector, useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';

import type { TabBaseType } from '@/components/surfaces';

export type Tabable = TabBaseType & {
  key: string;
};

export interface DockViewLayout {
  layout: string;
  activeGroup?: string;
}

// Recoil atoms for tab state
export const tabsState = atom<Tabable[]>({
  key: 'tabsState',
  default: [],
});

export const layoutState = atom<DockViewLayout | null>({
  key: 'layoutState',
  default: null,
});

export const activeTabIdState = atom<string | null>({
  key: 'activeTabIdState',
  default: null,
});

// Selector to get a tab by ID
export const tabByIdSelector = selector({
  key: 'tabByIdSelector',
  get: ({ get }) => (id: string) => {
    const tabs = get(tabsState);
    const [kind, key] = id.split('/');
    return tabs.find(tab => tab.kind === kind && tab.key === key);
  },
});

export interface TabNameProps {
  name: string;
  icon?: IconDefinition | string;
}

export const tabNameFamily = atomFamily<TabNameProps, string>({
  key: 'tabName',
  default: {
    name: '',
  },
});

export const TabContext = createContext<{ key: string }>({
  key: '',
});

export function useTabkit() {
  const [tabs, setTabs] = useRecoilState(tabsState);
  const [activeTabId, setActiveTabId] = useRecoilState(activeTabIdState);
  const getTabById = useRecoilValue(tabByIdSelector);
  
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
      if (tabs.length === 0 || openNew) {
        openNewChannel(tab);
        return;
      }

      const tabId = `${tab.kind}/${tab.key}`;
      const existingTab = getTabById(tabId);
      
      if (existingTab) {
        setActiveTabId(tabId);
        saveActiveTabToStorage(tabId);
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
      const newTabs = tabs.filter(tab => !(tab.kind === kind && tab.key === key));
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
  return useRecoilValue(tabsState);
}

export function useActiveTabId() {
  return useRecoilValue(activeTabIdState);
}

export function useLayout() {
  return useRecoilValue(layoutState);
}