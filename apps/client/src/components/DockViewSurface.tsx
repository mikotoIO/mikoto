import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { normalizeMediaUrl } from '@/components/atoms/Avatar';
import {
  DockviewApi,
  DockviewDidDropEvent,
  DockviewReact,
  DockviewReadyEvent,
  IDockviewPanel,
  IDockviewPanelHeaderProps,
  IDockviewPanelProps,
  positionToDirection,
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
import { useNavigate } from 'react-router-dom';

import { WelcomePanel } from '@/components/WelcomePanel';
import {
  ErrorSurface,
  LoadingSurface,
  surfaceMap,
} from '@/components/surfaces';
import { useMikoto } from '@/hooks';
import {
  TabContext,
  Tabable,
  activeTabIdState,
  tabNameFamily,
  tabsState,
  useActiveTabId,
  useTabs,
} from '@/store/surface';

// Global surface kinds mapped to their static routes
const GLOBAL_SURFACE_ROUTES: Record<string, string> = {
  friends: '/friends',
  discovery: '/discover',
  spaceExplorer: '/spaces',
  accountSettings: '/settings',
  palette: '/palette',
  welcome: '/',
};

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

// Helper to check if an icon is a FontAwesome icon definition
function isFontAwesomeIcon(
  icon: IconDefinition | string,
): icon is IconDefinition {
  return typeof icon === 'object' && 'icon' in icon;
}

// Hook to sync with panel title changes
function useTitle(api: { title: string | undefined; onDidTitleChange: any }) {
  const [title, setTitle] = useState<string | undefined>(api.title);

  useEffect(() => {
    const disposable = api.onDidTitleChange(
      (event: { title: string | undefined }) => {
        setTitle(event.title);
      },
    );
    if (title !== api.title) {
      setTitle(api.title);
    }
    return () => disposable.dispose();
  }, [api, title]);

  return title;
}

// Custom tab component that displays the space icon before the title
function CustomTabComponent(props: IDockviewPanelHeaderProps) {
  const { api } = props;
  const panelId = api.id;
  const tabName = useAtomValue(tabNameFamily(panelId));
  const title = useTitle(api);
  const isMiddleMouseButton = useRef<boolean>(false);

  const onClose = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      api.close();
    },
    [api],
  );

  const onBtnPointerDown = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
  }, []);

  const onPointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      isMiddleMouseButton.current = event.button === 1;
    },
    [],
  );

  const onPointerUp = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (isMiddleMouseButton.current && event.button === 1) {
        isMiddleMouseButton.current = false;
        onClose(event);
      }
    },
    [onClose],
  );

  const onPointerLeave = useCallback(() => {
    isMiddleMouseButton.current = false;
  }, []);

  return (
    <div
      className="dv-default-tab"
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerLeave}
    >
      <span
        className="dv-default-tab-content"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {tabName.icon && (
          <span
            style={{
              marginRight: '6px',
              display: 'inline-flex',
              alignItems: 'center',
              flexShrink: 0,
            }}
          >
            {isFontAwesomeIcon(tabName.icon) ? (
              <FontAwesomeIcon
                icon={tabName.icon}
                style={{ fontSize: '12px' }}
              />
            ) : (
              <img
                src={normalizeMediaUrl(tabName.icon as string)}
                alt=""
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '3px',
                  objectFit: 'cover',
                }}
              />
            )}
          </span>
        )}
        {title}
      </span>
      <div
        className="dv-default-tab-action"
        onPointerDown={onBtnPointerDown}
        onClick={onClose}
      >
        <svg viewBox="0 0 11 11" width="11" height="11">
          <path d="M2.1 2.1 L8.9 8.9 M8.9 2.1 L2.1 8.9" stroke="currentColor" />
        </svg>
      </div>
    </div>
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
  const setActiveTabId = useAtom(activeTabIdState)[1];
  // Keep track of the last processed tabs array
  const prevTabsRef = useRef<Tabable[]>([]);
  const prevActiveTabIdRef = useRef<string | null>(null);
  const navigate = useNavigate();
  const mikoto = useMikoto();

  // Helper to get the URL segment for a space (uses @handle if available, otherwise UUID)
  const getSpaceUrlSegment = useCallback(
    (spaceId: string) => {
      const space = mikoto.spaces._get(spaceId);
      if (space?.handle) {
        return `@${space.handle}`;
      }
      return spaceId;
    },
    [mikoto],
  );

  // Helper to get URL path from an active panel
  const getUrlFromPanel = useCallback(
    (panel: IDockviewPanel | undefined) => {
      if (!panel) return '/';

      const tab = panel.params?.tab as Tabable | undefined;
      if (!tab) return '/';

      switch (tab.kind) {
        // Global surfaces with static routes
        case 'friends':
        case 'discovery':
        case 'spaceExplorer':
        case 'accountSettings':
        case 'palette':
        case 'welcome':
          return GLOBAL_SURFACE_ROUTES[tab.kind];

        // Channel surfaces: /space/:spaceRef/channel/:channelId
        case 'textChannel':
        case 'voiceChannel':
        case 'documentChannel': {
          const channelId = (tab as any).channelId;
          if (!channelId) return '/';
          const channel = mikoto.channels._get(channelId);
          if (!channel || !channel.spaceId) return '/';
          return `/space/${getSpaceUrlSegment(channel.spaceId)}/channel/${channel.id}`;
        }

        // Channel settings: /space/:spaceRef/channel/:channelId/settings
        case 'channelSettings': {
          const channelId = (tab as any).channelId;
          if (!channelId) return '/';
          const channel = mikoto.channels._get(channelId);
          if (!channel || !channel.spaceId) return '/';
          return `/space/${getSpaceUrlSegment(channel.spaceId)}/channel/${channel.id}/settings`;
        }

        // Space settings: /space/:spaceRef/settings
        case 'spaceSettings': {
          const spaceId = (tab as any).spaceId;
          if (!spaceId) return '/';
          return `/space/${getSpaceUrlSegment(spaceId)}/settings`;
        }

        // Search: /space/:spaceRef/search
        case 'search': {
          const spaceId = (tab as any).spaceId;
          if (!spaceId) return '/';
          return `/space/${getSpaceUrlSegment(spaceId)}/search`;
        }

        // Bot settings: /settings/bots/:botId
        case 'botSettings': {
          const botId = (tab as any).botId;
          if (!botId) return '/';
          return `/settings/bots/${botId}`;
        }

        default:
          return '/';
      }
    },
    [mikoto, getSpaceUrlSegment],
  );

  // Store navigate and getUrlFromPanel in refs so onReady callback can use them
  const navigateRef = useRef(navigate);
  const getUrlFromPanelRef = useRef(getUrlFromPanel);
  navigateRef.current = navigate;
  getUrlFromPanelRef.current = getUrlFromPanel;

  const components = useMemo(() => {
    return {
      surface: (props: SurfaceComponentProps) => (
        <SurfaceComponent {...props} />
      ),
    };
  }, []);

  // Sync new tabs from state → dockview (for tabs opened via click, not drag-drop)
  useEffect(() => {
    const api = dockviewRef.current.api;
    if (!api) return;

    const prevTabs = prevTabsRef.current;
    tabs.forEach((tab) => {
      const panelId = `${tab.kind}/${tab.key}`;
      const isNewTab = !prevTabs.some(
        (prevTab) => prevTab.kind === tab.kind && prevTab.key === tab.key,
      );
      if (isNewTab && !api.getPanel(panelId)) {
        api.addPanel({
          id: panelId,
          component: 'surface',
          params: { tab },
          title: 'Loading...',
        });
      }
    });

    prevTabsRef.current = [...tabs];
  }, [tabs]);

  // Sync active tab — only when activeTabId actually changes
  useEffect(() => {
    const api = dockviewRef.current.api;
    if (!api || !activeTabId) return;
    if (activeTabId === prevActiveTabIdRef.current) return;
    prevActiveTabIdRef.current = activeTabId;

    const panel = api.getPanel(activeTabId);
    if (panel) {
      panel.api.setActive();
    }
  }, [activeTabId]);

  const onReady = useCallback(
    (event: DockviewReadyEvent) => {
      dockviewRef.current.api = event.api;
      setDockviewApi(event.api); // Trigger re-render so TabTitleSync component renders

      // Set up event listeners BEFORE adding panels so we catch the first activation
      // Listen for panel removal to sync tabs state
      event.api.onDidRemovePanel((panel) => {
        const panelId = panel.id;
        const [kind, key] = panelId.split('/');
        setTabs((currentTabs) =>
          currentTabs.filter((tab) => !(tab.kind === kind && tab.key === key)),
        );
      });

      // Accept external drag-and-drop (e.g. channels from sidebar)
      event.api.onUnhandledDragOverEvent((e) => {
        if (
          e.nativeEvent.dataTransfer?.types.includes('application/mikoto-tab')
        ) {
          e.accept();
        }
      });

      // Listen for active panel changes to sync URL
      event.api.onDidActivePanelChange((panel) => {
        const newPath = getUrlFromPanelRef.current(panel);
        // Only navigate if the path actually changes
        if (window.location.pathname !== newPath) {
          navigateRef.current(newPath, { replace: true });
        }
      });

      // Set up panels for initial tabs (after listeners are ready)
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
    },
    [tabs, setTabs],
  );

  const onDidDrop = useCallback(
    (event: DockviewDidDropEvent) => {
      const rawTab = event.nativeEvent.dataTransfer?.getData(
        'application/mikoto-tab',
      );
      if (!rawTab) return;

      const tab: Tabable = JSON.parse(rawTab);
      const panelId = `${tab.kind}/${tab.key}`;

      // Don't add duplicate panels — just activate existing one
      const api = dockviewRef.current.api;
      if (api?.getPanel(panelId)) {
        api.getPanel(panelId)!.api.setActive();
        return;
      }

      // Add panel at the drop position in dockview first
      event.api.addPanel({
        id: panelId,
        component: 'surface',
        params: { tab },
        title: 'Loading...',
        position: {
          direction: positionToDirection(event.position),
          referenceGroup: event.group ?? undefined,
        },
      });

      // Then sync tab to state (effect will skip addPanel since it already exists)
      setTabs((currentTabs) => {
        if (currentTabs.some((t) => t.kind === tab.kind && t.key === tab.key)) {
          return currentTabs;
        }
        return [...currentTabs, tab];
      });
      // Sync activeTabId so it doesn't fight with dockview's activation
      setActiveTabId(panelId);
      prevActiveTabIdRef.current = panelId;
    },
    [setTabs, setActiveTabId],
  );

  if (tabs.length === 0) {
    return <WelcomePanel />;
  }

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <DockviewReact
        components={components}
        onReady={onReady}
        onDidDrop={onDidDrop}
        className="dockview-theme-mikoto"
        defaultTabComponent={CustomTabComponent}
      />
      {/* Sync tab names from TabName components to DockView panel titles */}
      {dockviewApi && <TabTitleSync tabs={tabs} api={dockviewApi} />}
    </div>
  );
};
