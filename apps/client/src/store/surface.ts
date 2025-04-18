import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { IDockviewPanelHeaderProps, IGridviewPanelProps } from 'dockview-react';
import { autorun, makeAutoObservable, runInAction } from 'mobx';
import { createContext } from 'react';
import { atomFamily } from 'recoil';

import type { TabBaseType } from '@/components/surfaces';

export type Tabable = TabBaseType & {
  key: string;
};

export interface DockViewLayout {
  layout: string;
  activeGroup?: string;
}

export class SurfaceStore {
  tabs: Tabable[];
  layout: DockViewLayout | null;
  activeTabId: string | null;

  constructor() {
    this.tabs = [];
    this.layout = null;
    this.activeTabId = null;
    
    try {
      const storedTabs = localStorage.getItem('surface_tabs');
      const storedLayout = localStorage.getItem('surface_layout');
      const storedActiveTab = localStorage.getItem('surface_active_tab');
      
      if (storedTabs) {
        this.tabs = JSON.parse(storedTabs);
      }
      
      if (storedLayout) {
        this.layout = JSON.parse(storedLayout);
      }
      
      if (storedActiveTab) {
        this.activeTabId = storedActiveTab;
      }
    } catch (_) {
      // ignore
    }
    
    makeAutoObservable(this);
    
    autorun(() => {
      localStorage.setItem('surface_tabs', JSON.stringify(this.tabs));
      if (this.layout) {
        localStorage.setItem('surface_layout', JSON.stringify(this.layout));
      }
      if (this.activeTabId) {
        localStorage.setItem('surface_active_tab', this.activeTabId);
      }
    });
  }

  getTab(id: string): Tabable | undefined {
    const [kind, key] = id.split('/');
    return this.tabs.find(tab => tab.kind === kind && tab.key === key);
  }

  addTab(tab: Tabable) {
    const existingTabIndex = this.tabs.findIndex(
      t => t.kind === tab.kind && t.key === tab.key
    );
    
    if (existingTabIndex === -1) {
      this.tabs.push(tab);
    }
    
    this.activeTabId = `${tab.kind}/${tab.key}`;
  }

  removeTab(id: string) {
    const [kind, key] = id.split('/');
    const index = this.tabs.findIndex(tab => tab.kind === kind && tab.key === key);
    
    if (index !== -1) {
      this.tabs.splice(index, 1);
    }
  }

  setActiveTab(id: string) {
    this.activeTabId = id;
  }

  updateLayout(layout: DockViewLayout) {
    this.layout = layout;
  }
}

export const surfaceStore = new SurfaceStore();

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
  function openNewChannel(ch: Tabable) {
    runInAction(() => {
      surfaceStore.addTab(ch);
    });
  }

  return {
    openNewChannel,
    openTab(tab: Tabable, openNew: boolean = false) {
      if (surfaceStore.tabs.length === 0 || openNew) {
        openNewChannel(tab);
        return;
      }

      runInAction(() => {
        const tabId = `${tab.kind}/${tab.key}`;
        const existingTab = surfaceStore.getTab(tabId);
        
        if (existingTab) {
          surfaceStore.setActiveTab(tabId);
        } else {
          surfaceStore.addTab(tab);
        }
      });
    },
  };
}
