import { DockviewApi, DockviewReadyEvent, DockviewReact, IDockviewPanel, IDockviewPanelProps } from 'dockview-react';
import { ReactNode, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useRecoilState, useRecoilValue, useRecoilCallback } from 'recoil';

import { WelcomePanel } from '@/components/WelcomePanel';
import { ErrorSurface, LoadingSurface, surfaceMap } from '@/components/surfaces';
import { TabName } from '@/components/tabs';
import { TabContext, Tabable, tabNameFamily, tabsState, useActiveTabId, useTabkit, useTabs } from '@/store/surface';

interface SurfaceComponentProps extends IDockviewPanelProps {
  params: {
    tab: Tabable;
  };
}

function SurfaceComponent(props: SurfaceComponentProps) {
  const { params } = props;
  const { tab } = params;
  const { kind, key, ...rest } = tab;
  const SurfaceComponent = surfaceMap[kind] as any;
  
  if (!SurfaceComponent) {
    return null;
  }

  return (
    <TabContext.Provider value={{ key: `${kind}/${key}` }}>
      <ErrorBoundary FallbackComponent={ErrorSurface}>
        <Suspense fallback={<LoadingSurface />}>
          <SurfaceComponent {...rest} key={key} />
        </Suspense>
      </ErrorBoundary>
    </TabContext.Provider>
  );
}

interface TabContainerProps {
  children?: ReactNode;
}

export const DockViewSurface = ({ children }: TabContainerProps) => {
  const tabs = useTabs();
  const activeTabId = useActiveTabId();
  const dockviewRef = useRef<{ api: DockviewApi | null }>({ api: null });
  const tabkit = useTabkit();
  const setTabs = useRecoilState(tabsState)[1];
  // Keep track of the last processed tabs array
  const prevTabsRef = useRef<Tabable[]>([]);
  
  const components = useMemo(() => {
    return {
      surface: (props: SurfaceComponentProps) => <SurfaceComponent {...props} />,
    };
  }, []);

  // Process any tab changes - adding new tabs or updating active tab
  useEffect(() => {
    const api = dockviewRef.current.api;
    if (!api) return;
    
    // Check for new tabs that need to be added
    const prevTabs = prevTabsRef.current;
    tabs.forEach(tab => {
      const panelId = `${tab.kind}/${tab.key}`;
      
      // Check if this is a new tab that needs to be added
      const isNewTab = !prevTabs.some(
        prevTab => prevTab.kind === tab.kind && prevTab.key === tab.key
      );
      
      if (isNewTab) {
        api.addPanel({
          id: panelId,
          component: 'surface',
          params: { tab },
        });
      }
      
      // We'll handle updating panel titles in a separate effect
    });
    
    // Set active panel if activeTabId is set
    if (activeTabId) {
      const panel = api.getPanel(activeTabId);
      if (panel) {
        panel.api.setActive();
      }
    }
    
    // Update prevTabsRef
    prevTabsRef.current = [...tabs];
  }, [tabs, activeTabId]);
  
  // Update panel titles from tab names
  const updatePanelTitles = useRecoilCallback(({ snapshot }) => async () => {
    const api = dockviewRef.current.api;
    if (!api) return;
    
    // For each panel, update its title from the corresponding tab name in Recoil state
    tabs.forEach(async (tab) => {
      const panelId = `${tab.kind}/${tab.key}`;
      const panel = api.getPanel(panelId);
      if (panel && panel.api.setTitle) {
        // Get the tab name from Recoil state
        const tabNameValue = await snapshot.getPromise(tabNameFamily(panelId));
        if (tabNameValue?.name) {
          panel.api.setTitle(tabNameValue.name);
        }
      }
    });
  }, [tabs]);
  
  // Set up an interval to update panel titles
  useEffect(() => {
    // Initial update
    updatePanelTitles();
    
    // Update every second
    const intervalId = setInterval(updatePanelTitles, 1000);
    
    return () => clearInterval(intervalId);
  }, [updatePanelTitles]);

  const onReady = useCallback((event: DockviewReadyEvent) => {
    dockviewRef.current.api = event.api;
    
    // Set up panels for initial tabs
    tabs.forEach(tab => {
      const panelId = `${tab.kind}/${tab.key}`;
      event.api.addPanel({
        id: panelId,
        component: 'surface',
        params: { tab },
        title: tab.kind,
      });
      
      // Panel is initially set up with the kind as title.
      // Each component will update its own title via TabName component
    });

    // Store initial tabs
    prevTabsRef.current = [...tabs];

    // Listen for any layout changes
    event.api.onDidLayoutChange(() => {
      // If all panels are closed, update our tab state
      if (event.api.panels.length === 0) {
        setTabs([]);
      }
    });
  }, [tabs, setTabs]);

  // Render panel titles
  const renderTabTitle = useCallback((id: string) => {
    const tabName = useRecoilValue(tabNameFamily(id));
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {typeof tabName.icon === 'string' ? (
          <img src={tabName.icon} alt="" style={{ width: 16, height: 16 }} />
        ) : null}
        <span>{tabName.name}</span>
      </div>
    );
  }, []);

  if (tabs.length === 0) {
    return <WelcomePanel />;
  }
  
  return (
    <div style={{ width: '100%', height: '100%' }}>
      <DockviewReact
        components={components}
        onReady={onReady}
        className="dockview-theme-light"
      />
      {/* TabName components will be rendered by each surface component with the correct name and icon */}
    </div>
  );
};