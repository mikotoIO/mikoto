import {
  DockviewApi,
  DockviewReact,
  DockviewReadyEvent,
  IDockviewPanelProps,
} from 'dockview-react';
import { useAtom, useAtomValue } from 'jotai';
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import { WelcomePanel } from '@/components/WelcomePanel';
import {
  ErrorSurface,
  LoadingSurface,
  surfaceMap,
} from '@/components/surfaces';
import {
  TabContext,
  Tabable,
  tabNameFamily,
  tabsState,
  useActiveTabId,
  useTabs,
} from '@/store/surface';

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

// Helper component to sync a single tab name with its panel title
function SingleTabTitleSync({
  panelId,
  api,
}: {
  panelId: string;
  api: DockviewApi;
}) {
  const tabName = useAtomValue(tabNameFamily(panelId));

  useEffect(() => {
    const panel = api.getPanel(panelId);
    if (panel) {
      // Set title even if empty to override the panel ID default
      // Use a loading placeholder if name is not set yet
      const title = tabName.name || 'Loading...';
      panel.api.setTitle(title);
    }
  }, [tabName.name, panelId, api]);

  return null;
}

// Helper component to sync all tab names with panel titles
function TabTitleSync({ tabs, api }: { tabs: Tabable[]; api: DockviewApi }) {
  return (
    <>
      {tabs.map((tab) => (
        <SingleTabTitleSync
          key={`${tab.kind}/${tab.key}`}
          panelId={`${tab.kind}/${tab.key}`}
          api={api}
        />
      ))}
    </>
  );
}

export const DockViewSurface = () => {
  const tabs = useTabs();
  const activeTabId = useActiveTabId();
  const dockviewRef = useRef<{ api: DockviewApi | null }>({ api: null });
  const [dockviewApi, setDockviewApi] = useState<DockviewApi | null>(null);
  const setTabs = useAtom(tabsState)[1];
  // Keep track of the last processed tabs array
  const prevTabsRef = useRef<Tabable[]>([]);

  const components = useMemo(() => {
    return {
      surface: (props: SurfaceComponentProps) => (
        <SurfaceComponent {...props} />
      ),
    };
  }, []);

  // Process any tab changes - adding new tabs or updating active tab
  useEffect(() => {
    const api = dockviewRef.current.api;
    if (!api) return;

    // Check for new tabs that need to be added
    const prevTabs = prevTabsRef.current;
    tabs.forEach((tab) => {
      const panelId = `${tab.kind}/${tab.key}`;

      // Check if this is a new tab that needs to be added
      const isNewTab = !prevTabs.some(
        (prevTab) => prevTab.kind === tab.kind && prevTab.key === tab.key,
      );

      if (isNewTab) {
        api.addPanel({
          id: panelId,
          component: 'surface',
          params: { tab },
          title: 'Loading...', // Temporary title until TabName component sets the actual name
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

  const onReady = useCallback(
    (event: DockviewReadyEvent) => {
      dockviewRef.current.api = event.api;
      setDockviewApi(event.api); // Trigger re-render so TabTitleSync component renders

      // Set up panels for initial tabs
      tabs.forEach((tab) => {
        const panelId = `${tab.kind}/${tab.key}`;
        event.api.addPanel({
          id: panelId,
          component: 'surface',
          params: { tab },
          title: 'Loading...', // Temporary title until TabName component sets the actual name
        });

        // Panel title will be updated by TabTitleSync component
        // which reads from the tabNameFamily atom
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
    },
    [tabs, setTabs],
  );

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
      {/* Sync tab names from TabName components to DockView panel titles */}
      {dockviewApi && <TabTitleSync tabs={tabs} api={dockviewApi} />}
    </div>
  );
};
