import {
  DockviewApi,
  DockviewDidDropEvent,
  DockviewReact,
  DockviewReadyEvent,
  type DockviewTheme,
  IDockviewPanel,
  IDockviewPanelHeaderProps,
  IDockviewPanelProps,
  positionToDirection,
} from 'dockview-react';
import { useAtomValue, useSetAtom } from 'jotai';
import { X } from 'lucide-react';
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { useSnapshot } from 'valtio/react';

import { WelcomePanel } from '@/components/WelcomePanel';
import { normalizeMediaUrl } from '@/components/atoms/Avatar';
import { SpaceIcon } from '@/components/atoms/SpaceIcon';
import {
  LoadingSurface,
  isTabable,
  renderSurface,
} from '@/components/surfaces';
import { Skeleton, SurfaceErrorBoundary } from '@/design';
import { setActiveChannelId } from '@/functions/notify';
import { useMikoto } from '@/hooks';
import {
  TabContext,
  type TabNameProps,
  Tabable,
  activeTabIdState,
  tabNameFamily,
  tabsState,
  useActiveTabId,
  useTabs,
} from '@/store/surface';
import { ackStore, isChannelUnread } from '@/store/unreads';

import styles from './DockViewSurface.module.css';

/** Groups are sheets separated by an 8px gap; see design/dockview.css. */
const mikotoDockviewTheme: DockviewTheme = {
  name: 'mikoto',
  className: 'dockview-theme-mikoto',
  gap: 8,
  dndOverlayMounting: 'relative',
  dndPanelOverlay: 'content',
};

const CHANNEL_KINDS = new Set([
  'textChannel',
  'voiceChannel',
  'documentChannel',
]);

const tabId = (tab: Tabable) => `${tab.kind}/${tab.key}`;

/** Splits a panel id ("kind/key") without assuming the key has no slash. */
function parseTabId(id: string): { kind: string; key: string } | null {
  const i = id.indexOf('/');
  if (i === -1) return null;
  return { kind: id.slice(0, i), key: id.slice(i + 1) };
}

/* ------------------------------------------------------------- surface */

interface SurfaceComponentProps extends IDockviewPanelProps {
  params: {
    tab: Tabable;
  };
}

function SurfaceComponent({ params }: SurfaceComponentProps) {
  const { tab } = params;
  const id = tabId(tab);
  const tabName = useAtomValue(tabNameFamily(id));

  return (
    <TabContext value={{ key: id }}>
      <SurfaceErrorBoundary
        what={tabName.name || 'This tab'}
        resetKeys={[tab.key]}
        note="Your other tabs aren't affected."
      >
        <Suspense fallback={<LoadingSurface />}>{renderSurface(tab)}</Suspense>
      </SurfaceErrorBoundary>
    </TabContext>
  );
}

/* ----------------------------------------------------------------- tab */

function TabIcon({ tabName }: { tabName: TabNameProps }) {
  const mikoto = useMikoto();
  const { icon, spaceId, spaceName } = tabName;

  if (typeof icon === 'string') {
    return (
      <img className={styles.image} src={normalizeMediaUrl(icon)} alt="" />
    );
  }
  if (icon) {
    const Icon = icon;
    return <Icon size={14} aria-hidden />;
  }
  if (spaceId) {
    const space = mikoto.spaces._get(spaceId) ?? {
      id: spaceId,
      name: spaceName ?? '',
    };
    return <SpaceIcon space={space} size={16} />;
  }
  return null;
}

/** Unread dot for channel tabs that aren't the active tab. */
function useTabUnread(panelId: string): boolean {
  const mikoto = useMikoto();
  const activeTabId = useActiveTabId();
  useSnapshot(ackStore);
  useSnapshot(mikoto.channels.cache);
  if (panelId === activeTabId) return false;
  const parsed = parseTabId(panelId);
  if (!parsed || !CHANNEL_KINDS.has(parsed.kind)) return false;
  const channel = mikoto.channels._get(parsed.key);
  return channel ? isChannelUnread(channel.lastUpdated, channel.id) : false;
}

function DockTab({ api }: IDockviewPanelHeaderProps) {
  const tabName = useAtomValue(tabNameFamily(api.id));
  const unread = useTabUnread(api.id);
  const middleDownRef = useRef(false);

  const close = useCallback(
    (event: React.SyntheticEvent) => {
      event.preventDefault();
      event.stopPropagation();
      api.close();
    },
    [api],
  );

  return (
    <div
      className={styles.tab}
      title={tabName.name || undefined}
      onPointerDown={(event) => {
        middleDownRef.current = event.button === 1;
      }}
      onPointerUp={(event) => {
        if (middleDownRef.current && event.button === 1) {
          middleDownRef.current = false;
          close(event);
        }
      }}
      onPointerLeave={() => {
        middleDownRef.current = false;
      }}
    >
      <span className={styles.icon}>
        <TabIcon tabName={tabName} />
      </span>
      <span className={styles.title}>
        {tabName.name || (
          <>
            <Skeleton width={64} height={10} />
            <span className="sr-only">Loading</span>
          </>
        )}
      </span>
      {unread && <span className={styles.dot} aria-label="Unread" />}
      <button
        type="button"
        className={styles.close}
        aria-label={tabName.name ? `Close ${tabName.name}` : 'Close tab'}
        onPointerDown={(event) => event.preventDefault()}
        onClick={close}
      >
        <X size={14} aria-hidden />
      </button>
    </div>
  );
}

/* ---------------------------------------------------------- title sync */

// Keeps dockview's own panel titles (used in its overflow menu and for
// accessibility) in sync with the names surfaces declare via <TabName>.
function SingleTabTitleSync({
  panelId,
  api,
}: {
  panelId: string;
  api: DockviewApi;
}) {
  const tabName = useAtomValue(tabNameFamily(panelId));

  useEffect(() => {
    api.getPanel(panelId)?.api.setTitle(tabName.name || 'Loading…');
  }, [tabName.name, panelId, api]);

  return null;
}

function TabTitleSync({ tabs, api }: { tabs: Tabable[]; api: DockviewApi }) {
  return (
    <>
      {tabs.map((tab) => (
        <SingleTabTitleSync key={tabId(tab)} panelId={tabId(tab)} api={api} />
      ))}
    </>
  );
}

/* --------------------------------------------------------------- dock */

// Global surface kinds mapped to their static routes
const GLOBAL_SURFACE_ROUTES: Record<string, string> = {
  friends: '/friends',
  discovery: '/discover',
  spaceExplorer: '/spaces',
  accountSettings: '/settings',
  palette: '/palette',
  welcome: '/',
};

export const DockViewSurface = () => {
  const tabs = useTabs();
  const activeTabId = useActiveTabId();
  const dockviewRef = useRef<{ api: DockviewApi | null }>({ api: null });
  const [dockviewApi, setDockviewApi] = useState<DockviewApi | null>(null);
  const setTabs = useSetAtom(tabsState);
  const setActiveTabId = useSetAtom(activeTabIdState);
  // Keep track of the last processed tabs array
  const prevTabsRef = useRef<Tabable[]>([]);
  const prevActiveTabIdRef = useRef<string | null>(null);
  // panel id -> tab, recorded whenever we add a panel
  const panelTabsRef = useRef(new Map<string, Tabable>());
  const navigate = useNavigate();
  const mikoto = useMikoto();

  // Track the active channel for notification suppression
  useEffect(() => {
    const parsed = activeTabId ? parseTabId(activeTabId) : null;
    setActiveChannelId(
      parsed && CHANNEL_KINDS.has(parsed.kind) ? parsed.key : null,
    );
  }, [activeTabId]);

  // URL segment for a space (uses @handle if available, otherwise UUID)
  const getSpaceUrlSegment = useCallback(
    (spaceId: string) => {
      const space = mikoto.spaces._get(spaceId);
      return space?.handle ? `@${space.handle}` : spaceId;
    },
    [mikoto],
  );

  // URL path for the active panel
  const getUrlFromPanel = useCallback(
    (panel: IDockviewPanel | undefined) => {
      if (!panel) return '/';
      const tab = panelTabsRef.current.get(panel.id);
      if (!tab) return '/';

      switch (tab.kind) {
        case 'friends':
        case 'discovery':
        case 'spaceExplorer':
        case 'accountSettings':
        case 'palette':
          return GLOBAL_SURFACE_ROUTES[tab.kind];

        // Channel surfaces: /space/:spaceRef/channel/:channelId
        case 'textChannel':
        case 'voiceChannel':
        case 'documentChannel': {
          const channel = mikoto.channels._get(tab.channelId);
          if (!channel || !channel.spaceId) return '/';
          return `/space/${getSpaceUrlSegment(channel.spaceId)}/channel/${channel.id}`;
        }

        // Channel settings: /space/:spaceRef/channel/:channelId/settings
        case 'channelSettings': {
          const channel = mikoto.channels._get(tab.channelId);
          if (!channel || !channel.spaceId) return '/';
          return `/space/${getSpaceUrlSegment(channel.spaceId)}/channel/${channel.id}/settings`;
        }

        // Space settings: /space/:spaceRef/settings
        case 'spaceSettings':
          return `/space/${getSpaceUrlSegment(tab.spaceId)}/settings`;

        // Bot settings: /settings/bots/:botId
        case 'botSettings':
          return `/settings/bots/${tab.botId}`;

        default:
          return '/';
      }
    },
    [mikoto, getSpaceUrlSegment],
  );

  // Refs so the onReady listeners always call the latest versions
  const navigateRef = useRef(navigate);
  const getUrlFromPanelRef = useRef(getUrlFromPanel);
  useEffect(() => {
    navigateRef.current = navigate;
    getUrlFromPanelRef.current = getUrlFromPanel;
  });

  const addPanel = useCallback(
    (
      api: DockviewApi,
      tab: Tabable,
      position?: Parameters<DockviewApi['addPanel']>[0]['position'],
    ) => {
      const id = tabId(tab);
      panelTabsRef.current.set(id, tab);
      api.addPanel({
        id,
        component: 'surface',
        params: { tab },
        title: 'Loading…',
        position,
      });
    },
    [],
  );

  const components = useMemo(
    () => ({
      surface: (props: SurfaceComponentProps) => (
        <SurfaceComponent {...props} />
      ),
    }),
    [],
  );

  // Sync new tabs from state → dockview (for tabs opened via click, not drag-drop)
  useEffect(() => {
    const api = dockviewRef.current.api;
    if (!api) return;

    const prevTabs = prevTabsRef.current;
    tabs.forEach((tab) => {
      const isNewTab = !prevTabs.some(
        (prevTab) => prevTab.kind === tab.kind && prevTab.key === tab.key,
      );
      if (isNewTab && !api.getPanel(tabId(tab))) {
        addPanel(api, tab);
      }
    });

    prevTabs.forEach((prevTab) => {
      const stillOpen = tabs.some(
        (tab) => tab.kind === prevTab.kind && tab.key === prevTab.key,
      );
      if (stillOpen) return;
      const panel = api.getPanel(tabId(prevTab));
      if (panel) {
        api.removePanel(panel);
      }
    });

    prevTabsRef.current = [...tabs];
  }, [tabs, addPanel]);

  // Sync active tab — only when activeTabId actually changes
  useEffect(() => {
    const api = dockviewRef.current.api;
    if (!api || !activeTabId) return;
    if (activeTabId === prevActiveTabIdRef.current) return;
    prevActiveTabIdRef.current = activeTabId;
    api.getPanel(activeTabId)?.api.setActive();
  }, [activeTabId]);

  const onReady = useCallback(
    (event: DockviewReadyEvent) => {
      dockviewRef.current.api = event.api;
      setDockviewApi(event.api); // re-render so TabTitleSync renders

      // Set up listeners BEFORE adding panels so we catch the first activation.
      event.api.onDidRemovePanel((panel) => {
        panelTabsRef.current.delete(panel.id);
        const parsed = parseTabId(panel.id);
        if (!parsed) return;
        setTabs((currentTabs) =>
          currentTabs.filter(
            (tab) => !(tab.kind === parsed.kind && tab.key === parsed.key),
          ),
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

      // Sync URL and active tab state with the active panel
      event.api.onDidActivePanelChange((panel) => {
        const newPath = getUrlFromPanelRef.current(panel);
        if (window.location.pathname !== newPath) {
          navigateRef.current(newPath, { replace: true });
        }

        const panelId = panel?.id ?? null;
        if (panelId !== prevActiveTabIdRef.current) {
          prevActiveTabIdRef.current = panelId;
          setActiveTabId(panelId);
        }
      });

      // Panels for the initial tabs (titles are filled in by TabTitleSync)
      tabs.forEach((tab) => addPanel(event.api, tab));
      prevTabsRef.current = [...tabs];
    },
    [tabs, setTabs, setActiveTabId, addPanel],
  );

  const onDidDrop = useCallback(
    (event: DockviewDidDropEvent) => {
      const rawTab = event.nativeEvent.dataTransfer?.getData(
        'application/mikoto-tab',
      );
      if (!rawTab) return;

      let tab: unknown;
      try {
        tab = JSON.parse(rawTab);
      } catch {
        return;
      }
      if (!isTabable(tab)) return;
      const panelId = tabId(tab);

      // Don't add duplicate panels — just activate the existing one
      const existing = dockviewRef.current.api?.getPanel(panelId);
      if (existing) {
        existing.api.setActive();
        return;
      }

      // Add the panel at the drop position first...
      addPanel(event.api, tab, {
        direction: positionToDirection(event.position),
        referenceGroup: event.group ?? undefined,
      });

      // ...then sync it to state (the effect skips addPanel since it exists)
      setTabs((currentTabs) =>
        currentTabs.some((t) => t.kind === tab.kind && t.key === tab.key)
          ? currentTabs
          : [...currentTabs, tab],
      );
      // Sync activeTabId so it doesn't fight with dockview's activation
      setActiveTabId(panelId);
      prevActiveTabIdRef.current = panelId;
    },
    [setTabs, setActiveTabId, addPanel],
  );

  if (tabs.length === 0) {
    return (
      <div className={styles.empty}>
        <WelcomePanel />
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <DockviewReact
        components={components}
        onReady={onReady}
        onDidDrop={onDidDrop}
        theme={mikotoDockviewTheme}
        defaultTabComponent={DockTab}
      />
      {dockviewApi && <TabTitleSync tabs={tabs} api={dockviewApi} />}
    </div>
  );
};
