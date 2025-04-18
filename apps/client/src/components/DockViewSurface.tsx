import { DockviewApi, DockviewReadyEvent, DockviewReact, IDockviewPanel, IDockviewPanelProps } from 'dockview-react';
import { ReactNode, Suspense, useCallback, useMemo, useRef } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useRecoilState, useRecoilValue } from 'recoil';

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
  
  const components = useMemo(() => {
    return {
      surface: (props: SurfaceComponentProps) => <SurfaceComponent {...props} />,
    };
  }, []);

  const onReady = useCallback((event: DockviewReadyEvent) => {
    dockviewRef.current.api = event.api;
    
    // Set up panels for tabs
    tabs.forEach(tab => {
      const panelId = `${tab.kind}/${tab.key}`;
      event.api.addPanel({
        id: panelId,
        component: 'surface',
        params: { tab },
      });
    });

    // Listen for any layout changes
    event.api.onDidLayoutChange(() => {
      // If all panels are closed, update our tab state
      if (event.api.panels.length === 0) {
        setTabs([]);
      }
    });
  }, [tabs, tabkit, activeTabId, setTabs]);

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
      {tabs.map(tab => (
        <TabName
          key={`${tab.kind}/${tab.key}`}
          name={tab.kind}
          icon={undefined}
        />
      ))}
    </div>
  );
};