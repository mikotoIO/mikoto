import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { Suspense, lazy, useEffect, useRef } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { useSnapshot } from 'valtio/react';

import { CommandMenuKit } from '@/components/CommandMenu';
import { ContextMenuKit, ModalKit } from '@/components/ContextMenu';
import { DockViewSurface } from '@/components/DockViewSurface';
import { UserArea } from '@/components/UserArea';
import { Sidebar, SidebarRowsSkeleton } from '@/components/sidebars/Base';
import { FriendSidebar } from '@/components/sidebars/FriendSidebar';
import { SpaceSidebar } from '@/components/sidebars/SpaceSidebar';
import { renderSurface } from '@/components/surfaces';
import { channelToTab } from '@/components/surfaces/Explorer/channelToTab';
import {
  DelayedFallback,
  RegionErrorBoundary,
  activeSpaceAccentAtom,
  spaceAccent,
} from '@/design';
import { useMikoto } from '@/hooks';
import { useIsMobile } from '@/hooks/useIsMobile';
import { treebarSpaceState, workspaceState } from '@/store';
import {
  Tabable,
  tabNameFamily,
  useActiveTabId,
  useTabkit,
} from '@/store/surface';

import { ConnectionBanner } from './ConnectionBanner';
import styles from './MainView.module.css';
import { MikotoClientProvider } from './MikotoClientProvider';
import { ShellSkeleton } from './ShellSkeleton';

const MobileMainView = lazy(() => import('./MobileView'));

const CHANNEL_KINDS = new Set([
  'textChannel',
  'voiceChannel',
  'documentChannel',
  'channelSettings',
]);

/**
 * Keeps `activeSpaceAccentAtom` on the space the user is in: the space shown
 * in the sidebar, else the focused tab's space. Null on Home, friends and DMs.
 */
function SpaceAccentSync() {
  const mikoto = useMikoto();
  const sidebar = useAtomValue(treebarSpaceState);
  const activeTabId = useActiveTabId();
  const activeTabName = useAtomValue(tabNameFamily(activeTabId ?? ''));
  const setAccent = useSetAtom(activeSpaceAccentAtom);
  useSnapshot(mikoto.spaces);

  let spaceId: string | undefined;
  if (sidebar?.kind === 'explorer') {
    spaceId = sidebar.spaceId;
  } else if (activeTabId) {
    const i = activeTabId.indexOf('/');
    const kind = activeTabId.slice(0, i);
    const key = activeTabId.slice(i + 1);
    if (kind === 'spaceSettings') spaceId = key;
    else if (CHANNEL_KINDS.has(kind)) {
      spaceId =
        mikoto.channels._get(key.replace(/^channelSettings\//, ''))?.spaceId ??
        undefined;
    }
    spaceId ??= activeTabName.spaceId;
  }
  const accent = spaceId ? spaceAccent(mikoto.spaces._get(spaceId)) : null;

  useEffect(() => {
    setAccent(accent);
  }, [accent, setAccent]);
  useEffect(() => () => setAccent(null), [setAccent]);

  return null;
}

function SidebarFallback() {
  return (
    <DelayedFallback>
      <SidebarRowsSkeleton rows={8} label="sidebar" />
    </DelayedFallback>
  );
}

const AppView = () => {
  const [leftSidebar, setLeftSidebar] = useAtom(treebarSpaceState);
  const mikoto = useMikoto();
  const [workspace, setWorkspace] = useAtom(workspaceState);
  const tabkit = useTabkit();
  const {
    spaceRef: routeSpaceRef,
    channelId: routeChannelId,
    botId: routeBotId,
  } = useParams<{
    spaceRef: string;
    channelId: string;
    botId: string;
  }>();

  // Resolve spaceRef to spaceId (handles @handle format)
  const routeSpaceId = routeSpaceRef
    ? routeSpaceRef.startsWith('@')
      ? mikoto.spaces._getByHandle(routeSpaceRef.slice(1))?.id
      : routeSpaceRef
    : undefined;
  const location = useLocation();
  const hasHandledRouteRef = useRef<string | null>(null);

  // Handle URL-based navigation to open appropriate tab
  useEffect(() => {
    const pathname = location.pathname;

    // Skip if we already handled this exact path
    if (hasHandledRouteRef.current === pathname) return;

    let tabToOpen: Tabable | null = null;

    switch (pathname) {
      case '/spaces':
        tabToOpen = { kind: 'spaceExplorer', key: 'spaceExplorer' };
        break;
      case '/friends':
        tabToOpen = { kind: 'friends', key: 'friends' };
        break;
      case '/discover':
        tabToOpen = { kind: 'discovery', key: 'discovery' };
        break;
      case '/settings':
        tabToOpen = { kind: 'accountSettings', key: 'accountSettings' };
        break;
      case '/palette':
        tabToOpen = { kind: 'palette', key: 'palette' };
        break;
      default:
        // Bot settings: /settings/bots/:botId
        if (pathname.startsWith('/settings/bots/') && routeBotId) {
          tabToOpen = {
            kind: 'botSettings',
            key: routeBotId,
            botId: routeBotId,
          };
        }
        // Space settings: /space/:spaceId/settings
        else if (
          routeSpaceId &&
          !routeChannelId &&
          pathname.endsWith('/settings')
        ) {
          tabToOpen = {
            kind: 'spaceSettings',
            key: routeSpaceId,
            spaceId: routeSpaceId,
          };
        }
        // Channel settings: /space/:spaceId/channel/:channelId/settings
        else if (
          routeSpaceId &&
          routeChannelId &&
          pathname.endsWith('/settings')
        ) {
          const channel = mikoto.channels._get(routeChannelId);
          if (channel && channel.spaceId === routeSpaceId) {
            tabToOpen = {
              kind: 'channelSettings',
              key: routeChannelId,
              channelId: routeChannelId,
            };
          }
        }
        // Channel: /space/:spaceId/channel/:channelId
        else if (routeSpaceId && routeChannelId) {
          const channel = mikoto.channels._get(routeChannelId);
          if (channel && channel.spaceId === routeSpaceId) {
            try {
              tabToOpen = channelToTab(channel);
            } catch {
              // Unknown channel type: leave the route alone.
            }
          }
        }
        // Space only: /space/:spaceRef (focus sidebar on space, no tab)
        else if (routeSpaceId && !routeChannelId) {
          setLeftSidebar({
            kind: 'explorer',
            key: `explorer/${routeSpaceId}`,
            spaceId: routeSpaceId,
          });
          hasHandledRouteRef.current = pathname;
        }
    }

    if (tabToOpen) {
      tabkit.openTab(tabToOpen);
      hasHandledRouteRef.current = pathname;
    }
  }, [
    location.pathname,
    routeSpaceId,
    routeChannelId,
    routeBotId,
    mikoto,
    tabkit,
    setLeftSidebar,
  ]);

  return (
    <div className={styles.app}>
      <SpaceAccentSync />
      <SpaceSidebar />
      {workspace.leftOpen && (
        <Sidebar
          position="left"
          size={workspace.left || 300}
          onResize={(size) => {
            setWorkspace((ws) => ({
              ...ws,
              left: (ws.left || 300) + size.width,
            }));
          }}
        >
          <div className={styles.sidebarContent}>
            <RegionErrorBoundary
              what={leftSidebar ? 'This space' : 'Home'}
              resetKeys={[leftSidebar?.key]}
            >
              <Suspense fallback={<SidebarFallback />}>
                {leftSidebar ? renderSurface(leftSidebar) : <FriendSidebar />}
              </Suspense>
            </RegionErrorBoundary>
          </div>
          <RegionErrorBoundary what="Your account">
            <UserArea />
          </RegionErrorBoundary>
        </Sidebar>
      )}
      <main className={styles.workspace}>
        <ConnectionBanner />
        <div className={styles.dock}>
          <DockViewSurface />
        </div>
      </main>
    </div>
  );
};

export default function MainView() {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Suspense fallback={<ShellSkeleton />}>
        <MobileMainView />
      </Suspense>
    );
  }

  return (
    <MikotoClientProvider fallback={<ShellSkeleton />}>
      <AppView />
      <CommandMenuKit />
      <ContextMenuKit />
      <ModalKit />
    </MikotoClientProvider>
  );
}
