import { MikotoChannel, MikotoSpace } from '@mikoto-io/mikoto.js';
import { ArrowLeft, Menu } from 'lucide-react';
import { Suspense, useCallback, useRef, useState } from 'react';
import { useSnapshot } from 'valtio/react';

import { CommandMenuKit } from '@/components/CommandMenu';
import {
  ContextMenuKit,
  ModalKit,
  useContextMenu,
} from '@/components/ContextMenu';
import { SpaceIcon } from '@/components/atoms/SpaceIcon';
import { MikotoLogo } from '@/components/icons';
import { SidebarRow } from '@/components/sidebars/Base';
import { SpaceContextMenu } from '@/components/sidebars/SpaceSidebar/SpaceContextMenu';
import { LoadingSurface, renderSurface } from '@/components/surfaces';
import { TreebarContextMenu } from '@/components/surfaces/Explorer';
import { ChannelContextMenu } from '@/components/surfaces/Explorer/ChannelContextMenu';
import {
  getIconFromChannelType,
  tryChannelToTab,
} from '@/components/surfaces/Explorer/channelToTab';
import { Button, IconButton, SurfaceErrorBoundary, cx, toast } from '@/design';
import { useMikoto } from '@/hooks';
import { TabContext, Tabable } from '@/store/surface';

import { MikotoClientProvider } from './MikotoClientProvider';
import styles from './MobileView.module.css';
import { ShellSkeleton } from './ShellSkeleton';

// --- Constants ---

const SIDEBAR_WIDTH = 300;
const SWIPE_EDGE_ZONE = 24;
const SWIPE_THRESHOLD = 0.3; // fraction of sidebar width to snap open

// --- Swipe Drawer Hook ---

function useSwipeDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [offset, setOffset] = useState(-SIDEBAR_WIDTH);
  const [animate, setAnimate] = useState(true);

  const trackingRef = useRef(false);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const currentOffsetRef = useRef(-SIDEBAR_WIDTH);
  const directionLockedRef = useRef<'horizontal' | 'vertical' | null>(null);

  const open = useCallback(() => {
    setAnimate(true);
    setOffset(0);
    currentOffsetRef.current = 0;
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setAnimate(true);
    setOffset(-SIDEBAR_WIDTH);
    currentOffsetRef.current = -SIDEBAR_WIDTH;
    setIsOpen(false);
  }, []);

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0];
      const inEdge = !isOpen && touch.clientX < SWIPE_EDGE_ZONE;
      if (!inEdge && !isOpen) return;

      trackingRef.current = true;
      directionLockedRef.current = null;
      startXRef.current = touch.clientX;
      startYRef.current = touch.clientY;
    },
    [isOpen],
  );

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!trackingRef.current) return;
      const touch = e.touches[0];
      const dx = touch.clientX - startXRef.current;
      const dy = touch.clientY - startYRef.current;

      // Lock direction on first significant movement
      if (directionLockedRef.current === null) {
        if (Math.abs(dx) < 5 && Math.abs(dy) < 5) return;
        directionLockedRef.current =
          Math.abs(dx) > Math.abs(dy) ? 'horizontal' : 'vertical';
      }

      if (directionLockedRef.current === 'vertical') return;

      setAnimate(false);
      const base = isOpen ? 0 : -SIDEBAR_WIDTH;
      const next = Math.min(0, Math.max(-SIDEBAR_WIDTH, base + dx));
      setOffset(next);
      currentOffsetRef.current = next;
    },
    [isOpen],
  );

  const onTouchEnd = useCallback(() => {
    if (!trackingRef.current) return;
    trackingRef.current = false;
    directionLockedRef.current = null;

    const progress = (currentOffsetRef.current + SIDEBAR_WIDTH) / SIDEBAR_WIDTH;
    if (progress > SWIPE_THRESHOLD) {
      open();
    } else {
      close();
    }
  }, [open, close]);

  return {
    isOpen,
    offset,
    animate,
    open,
    close,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  };
}

// --- Sidebar Content ---

type SelectChannel = (tab: Tabable, channel: MikotoChannel) => void;

function MobileSpaceIcon({
  space,
  active,
  onSelectSpace,
}: {
  space: MikotoSpace;
  active: boolean;
  onSelectSpace: (id: string) => void;
}) {
  const contextMenu = useContextMenu(() => <SpaceContextMenu space={space} />);

  return (
    <button
      type="button"
      className={styles.stripButton}
      aria-label={space.name}
      aria-current={active ? 'true' : undefined}
      onClick={() => onSelectSpace(space.id)}
      onContextMenu={contextMenu}
    >
      <SpaceIcon space={space} size={40} active={active} />
    </button>
  );
}

function MobileChannelNode({
  channel,
  allChannels,
  depth,
  onSelectChannel,
}: {
  channel: MikotoChannel;
  allChannels: MikotoChannel[];
  depth: number;
  onSelectChannel: SelectChannel;
}) {
  const [open, setOpen] = useState(depth === 0);
  const children = allChannels.filter((c) => c.parentId === channel.id);
  const isGroup = children.length > 0;
  const contextMenu = useContextMenu(() => (
    <ChannelContextMenu channel={channel} />
  ));
  const Icon = getIconFromChannelType(channel.type);

  const select = () => {
    const tab = tryChannelToTab(channel);
    if (tab) onSelectChannel(tab, channel);
    else
      toast({
        type: 'error',
        title: `Couldn't open #${channel.name}`,
        description:
          "This channel type isn't supported by this version of Mikoto. Reload to update.",
      });
  };

  return (
    <div>
      <SidebarRow
        icon={<Icon size={16} aria-hidden />}
        label={channel.name}
        aria-expanded={isGroup ? open : undefined}
        onClick={isGroup ? () => setOpen((o) => !o) : select}
        onContextMenu={contextMenu}
      />
      {isGroup && open && (
        <div className={styles.subtree} role="group">
          {children.map((child) => (
            <MobileChannelNode
              key={child.id}
              channel={child}
              allChannels={allChannels}
              depth={depth + 1}
              onSelectChannel={onSelectChannel}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function MobileChannelList({
  space,
  onSelectChannel,
}: {
  space: MikotoSpace;
  onSelectChannel: SelectChannel;
}) {
  useSnapshot(space);
  useSnapshot(space.channels);

  const allChannels: MikotoChannel[] = space.channels;
  const ids = new Set(allChannels.map((c) => c.id));
  // Channels whose parent is missing still show, at the root.
  const rootChannels = allChannels
    .filter((c) => !c.parentId || !ids.has(c.parentId))
    .sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
    );

  if (rootChannels.length === 0) {
    return <p className={styles.placeholder}>No channels in this space yet.</p>;
  }

  return (
    <>
      {rootChannels.map((channel) => (
        <MobileChannelNode
          key={channel.id}
          channel={channel}
          allChannels={allChannels}
          depth={0}
          onSelectChannel={onSelectChannel}
        />
      ))}
    </>
  );
}

function SidebarContent({
  selectedSpaceId,
  onSelectSpace,
  onSelectChannel,
}: {
  selectedSpaceId: string | null;
  onSelectSpace: (id: string) => void;
  onSelectChannel: SelectChannel;
}) {
  const mikoto = useMikoto();
  useSnapshot(mikoto.spaces);

  const spaces = Array.from(mikoto.spaces.cache.values()).filter(
    (s) => s.type === 'NONE',
  );
  const selectedSpace = selectedSpaceId
    ? mikoto.spaces._get(selectedSpaceId)
    : undefined;
  const contextMenu = useContextMenu(() =>
    selectedSpace ? <TreebarContextMenu space={selectedSpace} /> : null,
  );

  return (
    <>
      <nav className={styles.strip} aria-label="Spaces">
        {spaces.map((space) => (
          <MobileSpaceIcon
            key={space.id}
            space={space}
            active={space.id === selectedSpaceId}
            onSelectSpace={onSelectSpace}
          />
        ))}
      </nav>
      <div className={styles.panel}>
        {selectedSpace ? (
          <>
            <h2 className={styles.panelHead}>{selectedSpace.name}</h2>
            <nav
              className={styles.list}
              aria-label={`${selectedSpace.name} channels`}
              onContextMenu={contextMenu}
            >
              <MobileChannelList
                space={selectedSpace}
                onSelectChannel={onSelectChannel}
              />
            </nav>
          </>
        ) : (
          <p className={styles.placeholder}>
            {spaces.length === 0
              ? "You're not in any spaces yet. Join one with an invite link."
              : 'Pick a space to see its channels.'}
          </p>
        )}
      </div>
    </>
  );
}

// --- Surface Screen ---

function SurfaceView({ tab, title }: { tab: Tabable; title: string }) {
  const id = `${tab.kind}/${tab.key}`;
  return (
    <div className={styles.sheet}>
      <TabContext value={{ key: id }}>
        <SurfaceErrorBoundary
          what={title || 'This channel'}
          resetKeys={[tab.key]}
        >
          <Suspense fallback={<LoadingSurface />}>
            {renderSurface(tab)}
          </Suspense>
        </SurfaceErrorBoundary>
      </TabContext>
    </div>
  );
}

// --- Main Mobile App View ---

interface ActiveView {
  tab: Tabable;
  channel: MikotoChannel;
}

function MobileAppView() {
  const [activeView, setActiveView] = useState<ActiveView | null>(null);
  const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(null);
  const drawer = useSwipeDrawer();

  // Auto-select first space if none selected. Done during render as a
  // derived-state pattern instead of an effect to avoid an extra commit.
  const mikoto = useMikoto();
  useSnapshot(mikoto.spaces);
  if (!selectedSpaceId) {
    const firstSpace = Array.from(mikoto.spaces.cache.values()).find(
      (s) => s.type === 'NONE',
    );
    if (firstSpace) {
      setSelectedSpaceId(firstSpace.id);
    }
  }

  const drawerVisible = drawer.offset > -SIDEBAR_WIDTH;
  const ActiveIcon = activeView
    ? getIconFromChannelType(activeView.channel.type)
    : null;

  return (
    <div
      className={styles.container}
      onTouchStart={drawer.onTouchStart}
      onTouchMove={drawer.onTouchMove}
      onTouchEnd={drawer.onTouchEnd}
    >
      {activeView && ActiveIcon ? (
        <>
          <header className={styles.header}>
            <IconButton
              size="md"
              aria-label="Back to channels"
              onClick={() => {
                setActiveView(null);
                drawer.open();
              }}
            >
              <ArrowLeft size={18} aria-hidden />
            </IconButton>
            <h1 className={styles.title}>
              <ActiveIcon size={16} aria-hidden />
              {activeView.channel.name}
            </h1>
          </header>
          <SurfaceView tab={activeView.tab} title={activeView.channel.name} />
        </>
      ) : (
        <>
          <header className={styles.header}>
            <IconButton size="md" aria-label="Open menu" onClick={drawer.open}>
              <Menu size={18} aria-hidden />
            </IconButton>
            <h1 className={styles.title}>Mikoto</h1>
          </header>
          <div className={cx(styles.sheet, styles.welcome)}>
            <div className={styles.welcomeLogo}>
              <MikotoLogo size={28} />
            </div>
            <h1>Welcome to Mikoto</h1>
            <p>Swipe from the left edge or open the menu to pick a channel.</p>
            <Button variant="primary" onClick={drawer.open}>
              Browse channels
            </Button>
          </div>
        </>
      )}

      <div
        className={styles.scrim}
        aria-hidden
        onClick={drawer.close}
        style={{
          opacity: Math.max(0, (drawer.offset + SIDEBAR_WIDTH) / SIDEBAR_WIDTH),
          pointerEvents: drawerVisible ? 'auto' : 'none',
        }}
      />

      <aside
        className={cx(styles.drawer, drawer.animate && styles.animate)}
        style={{ transform: `translateX(${drawer.offset}px)` }}
        aria-label="Navigation"
        aria-hidden={!drawerVisible}
        inert={!drawerVisible}
      >
        <SidebarContent
          selectedSpaceId={selectedSpaceId}
          onSelectSpace={setSelectedSpaceId}
          onSelectChannel={(tab, channel) => {
            setActiveView({ tab, channel });
            drawer.close();
          }}
        />
      </aside>
    </div>
  );
}

export default function MobileMainView() {
  return (
    <MikotoClientProvider fallback={<ShellSkeleton />}>
      <MobileAppView />
      <CommandMenuKit />
      <ContextMenuKit />
      <ModalKit />
    </MikotoClientProvider>
  );
}
