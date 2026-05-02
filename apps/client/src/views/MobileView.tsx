import { Box, Flex, Heading, Text } from '@chakra-ui/react';
import styled from '@emotion/styled';
import {
  faArrowLeft,
  faBars,
  faHashtag,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { MikotoChannel, MikotoSpace } from '@mikoto-io/mikoto.js';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useSnapshot } from 'valtio/react';

import { CommandMenuKit } from '@/components/CommandMenu';
import {
  ContextMenuKit,
  ModalKit,
  useContextMenu,
} from '@/components/ContextMenu';
import { normalizeMediaUrl } from '@/components/atoms/Avatar';
import { faMikoto } from '@/components/icons';
import { SpaceContextMenu } from '@/components/sidebars/SpaceSidebar/SpaceContextMenu';
import {
  ErrorSurface,
  LoadingSurface,
  surfaceMap,
} from '@/components/surfaces';
import { TreebarContextMenu } from '@/components/surfaces/Explorer';
import { ChannelContextMenu } from '@/components/surfaces/Explorer/ChannelContextMenu';
import {
  channelToTab,
  getIconFromChannelType,
} from '@/components/surfaces/Explorer/channelToTab';
import { useMikoto } from '@/hooks';
import { TabContext, Tabable } from '@/store/surface';

import { MikotoClientProvider } from './MikotoClientProvider';

// --- Constants ---

const SIDEBAR_WIDTH = 300;
const SPACE_STRIP_WIDTH = 56;
const SWIPE_EDGE_ZONE = 24;
const SWIPE_THRESHOLD = 0.3; // fraction of sidebar width to snap open

// --- Styled Components ---

const MobileContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background-color: var(--chakra-colors-subsurface);
  color: var(--chakra-colors-text);
  overflow: hidden;
  position: relative;
`;

const MobileHeader = styled.div`
  display: flex;
  align-items: center;
  height: 48px;
  padding: 0 12px;
  gap: 12px;
  background-color: var(--chakra-colors-surface);
  border-bottom: 1px solid var(--chakra-colors-gray-700);
  flex-shrink: 0;
`;

const MobileContent = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
`;

const HeaderButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  background: none;
  color: var(--chakra-colors-gray-300);
  cursor: pointer;
  flex-shrink: 0;
  font-size: 18px;
`;

// --- Sidebar Drawer ---

const DrawerOverlay = styled.div<{ visible: boolean }>`
  position: absolute;
  inset: 0;
  z-index: 100;
  background-color: rgba(0, 0, 0, 0.5);
  opacity: ${(p) => (p.visible ? 1 : 0)};
  pointer-events: ${(p) => (p.visible ? 'auto' : 'none')};
  transition: opacity 0.2s ease;
`;

const DrawerContainer = styled.div<{ translateX: number; animate: boolean }>`
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  z-index: 101;
  width: ${SIDEBAR_WIDTH}px;
  display: flex;
  transform: translateX(${(p) => p.translateX}px);
  transition: ${(p) => (p.animate ? 'transform 0.25s ease' : 'none')};
  will-change: transform;
`;

const SpaceStrip = styled.div`
  width: ${SPACE_STRIP_WIDTH}px;
  flex-shrink: 0;
  background-color: var(--chakra-colors-gray-850);
  border-right: 1px solid var(--chakra-colors-gray-700);
  overflow-y: auto;
  scrollbar-width: none;
  padding: 8px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const SpaceStripIcon = styled.button<{ active?: boolean; icon?: string }>`
  width: 40px;
  height: 40px;
  border-radius: 4px;
  border: 2px solid
    ${(p) => (p.active ? 'var(--chakra-colors-gray-150)' : 'transparent')};
  background-color: var(--chakra-colors-surface);
  background-image: ${(p) => (p.icon ? `url(${p.icon})` : 'none')};
  background-size: cover;
  color: var(--chakra-colors-text);
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  padding: 0;
`;

const ChannelPanel = styled.div`
  flex: 1;
  min-width: 0;
  background-color: var(--chakra-colors-gray-800);
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const ChannelPanelHeader = styled.div`
  padding: 12px 14px;
  flex-shrink: 0;
`;

const ChannelPanelList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 0 4px 8px;
`;

const MobileChannelItem = styled.button<{ depth?: number }>`
  display: flex;
  align-items: center;
  width: 100%;
  height: 42px;
  padding: 0 12px;
  padding-left: ${(p) => 12 + (p.depth ?? 0) * 14}px;
  gap: 8px;
  border: none;
  background: none;
  color: var(--chakra-colors-gray-300);
  font-size: 15px;
  cursor: pointer;
  text-align: left;
  border-radius: 4px;

  &:active {
    background-color: var(--chakra-colors-gray-700);
  }

  svg {
    font-size: 13px;
    color: var(--chakra-colors-gray-500);
    flex-shrink: 0;
  }
`;

// --- Swipe Drawer Hook ---

function useSwipeDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [offset, setOffset] = useState(-SIDEBAR_WIDTH);
  const [animate, setAnimate] = useState(true);

  const tracking = useRef(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const currentOffset = useRef(-SIDEBAR_WIDTH);
  const directionLocked = useRef<'horizontal' | 'vertical' | null>(null);

  const open = useCallback(() => {
    setAnimate(true);
    setOffset(0);
    currentOffset.current = 0;
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setAnimate(true);
    setOffset(-SIDEBAR_WIDTH);
    currentOffset.current = -SIDEBAR_WIDTH;
    setIsOpen(false);
  }, []);

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0];
      const inEdge = !isOpen && touch.clientX < SWIPE_EDGE_ZONE;
      const inDrawer = isOpen;

      if (!inEdge && !inDrawer) return;

      tracking.current = true;
      directionLocked.current = null;
      startX.current = touch.clientX;
      startY.current = touch.clientY;
    },
    [isOpen],
  );

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!tracking.current) return;
      const touch = e.touches[0];
      const dx = touch.clientX - startX.current;
      const dy = touch.clientY - startY.current;

      // Lock direction on first significant movement
      if (directionLocked.current === null) {
        if (Math.abs(dx) < 5 && Math.abs(dy) < 5) return;
        directionLocked.current =
          Math.abs(dx) > Math.abs(dy) ? 'horizontal' : 'vertical';
      }

      if (directionLocked.current === 'vertical') return;

      setAnimate(false);
      const base = isOpen ? 0 : -SIDEBAR_WIDTH;
      const next = Math.min(0, Math.max(-SIDEBAR_WIDTH, base + dx));
      setOffset(next);
      currentOffset.current = next;
    },
    [isOpen],
  );

  const onTouchEnd = useCallback(() => {
    if (!tracking.current) return;
    tracking.current = false;
    directionLocked.current = null;

    const progress = (currentOffset.current + SIDEBAR_WIDTH) / SIDEBAR_WIDTH;
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
    <SpaceStripIcon
      active={active}
      icon={space.icon ? normalizeMediaUrl(space.icon) : undefined}
      onClick={() => onSelectSpace(space.id)}
      onContextMenu={contextMenu}
    >
      {!space.icon && space.name[0]}
    </SpaceStripIcon>
  );
}

function MobileChannelPanel({
  space,
  onSelectChannel,
}: {
  space: MikotoSpace;
  onSelectChannel: (tab: Tabable, title: string) => void;
}) {
  const contextMenu = useContextMenu(() => (
    <TreebarContextMenu space={space} />
  ));

  return (
    <>
      <ChannelPanelHeader>
        <Heading fontSize="15px" fontWeight="700" truncate>
          {space.name}
        </Heading>
      </ChannelPanelHeader>
      <ChannelPanelList onContextMenu={contextMenu}>
        <MobileChannelList space={space} onSelectChannel={onSelectChannel} />
      </ChannelPanelList>
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
  onSelectChannel: (tab: Tabable, title: string) => void;
}) {
  const mikoto = useMikoto();
  useSnapshot(mikoto.spaces);

  const spaces = Array.from(mikoto.spaces.cache.values()).filter(
    (s) => s.type === 'NONE',
  );
  const selectedSpace = selectedSpaceId
    ? mikoto.spaces._get(selectedSpaceId)
    : null;

  return (
    <>
      <SpaceStrip>
        {spaces.map((space) => (
          <MobileSpaceIcon
            key={space.id}
            space={space}
            active={space.id === selectedSpaceId}
            onSelectSpace={onSelectSpace}
          />
        ))}
      </SpaceStrip>
      <ChannelPanel>
        {selectedSpace ? (
          <MobileChannelPanel
            space={selectedSpace}
            onSelectChannel={onSelectChannel}
          />
        ) : (
          <Flex align="center" justify="center" flex="1" color="gray.500">
            <Text fontSize="14px">Select a space</Text>
          </Flex>
        )}
      </ChannelPanel>
    </>
  );
}

function MobileChannelList({
  space,
  onSelectChannel,
}: {
  space: MikotoSpace;
  onSelectChannel: (tab: Tabable, title: string) => void;
}) {
  useSnapshot(space);
  useSnapshot(space.channels);

  const allChannels = space.channels as MikotoChannel[];
  const rootChannels = allChannels.filter((c) => c.parentId === null);

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

function MobileChannelNode({
  channel,
  allChannels,
  depth,
  onSelectChannel,
}: {
  channel: MikotoChannel;
  allChannels: MikotoChannel[];
  depth: number;
  onSelectChannel: (tab: Tabable, title: string) => void;
}) {
  const [open, setOpen] = useState(depth === 0);
  const children = allChannels.filter((c) => c.parentId === channel.id);
  const isGroup = children.length > 0;
  const contextMenu = useContextMenu(() => (
    <ChannelContextMenu channel={channel} />
  ));

  const icon = getIconFromChannelType(channel.type) ?? faHashtag;

  if (isGroup) {
    return (
      <div>
        <MobileChannelItem
          depth={depth}
          onClick={() => setOpen(!open)}
          onContextMenu={contextMenu}
        >
          <FontAwesomeIcon icon={icon} />
          <span>{channel.name}</span>
        </MobileChannelItem>
        {open &&
          children.map((child) => (
            <MobileChannelNode
              key={child.id}
              channel={child}
              allChannels={allChannels}
              depth={depth + 1}
              onSelectChannel={onSelectChannel}
            />
          ))}
      </div>
    );
  }

  return (
    <MobileChannelItem
      depth={depth}
      onContextMenu={contextMenu}
      onClick={() => {
        try {
          const tab = channelToTab(channel);
          onSelectChannel(tab, channel.name);
        } catch {
          // Unknown channel type
        }
      }}
    >
      <FontAwesomeIcon icon={icon} />
      <span>{channel.name}</span>
    </MobileChannelItem>
  );
}

// --- Surface Screen ---

function SurfaceView({ tab }: { tab: Tabable }) {
  const SurfaceComponent = surfaceMap[tab.kind] as any;
  if (!SurfaceComponent) return null;

  const { kind, key, ...rest } = tab;

  return (
    <MobileContent style={{ overflow: 'hidden', display: 'flex' }}>
      <TabContext.Provider value={{ key: `${kind}/${key}` }}>
        <ErrorBoundary FallbackComponent={ErrorSurface}>
          <Suspense fallback={<LoadingSurface />}>
            <SurfaceComponent key={key} {...rest} />
          </Suspense>
        </ErrorBoundary>
      </TabContext.Provider>
    </MobileContent>
  );
}

// --- Welcome screen when no channel is selected ---

function WelcomeContent({ onOpenSidebar }: { onOpenSidebar: () => void }) {
  return (
    <>
      <MobileHeader>
        <HeaderButton onClick={onOpenSidebar}>
          <FontAwesomeIcon icon={faBars} />
        </HeaderButton>
        <Heading fontSize="16px" fontWeight="600">
          Mikoto
        </Heading>
      </MobileHeader>
      <Flex flex="1" align="center" justify="center" direction="column" gap={3}>
        <FontAwesomeIcon icon={faMikoto} fontSize="48px" />
        <Heading fontSize="18px">Welcome to Mikoto</Heading>
        <Text color="gray.400" fontSize="14px">
          Swipe right or tap the menu to get started
        </Text>
      </Flex>
    </>
  );
}

// --- Main Mobile App View ---

interface ActiveView {
  tab: Tabable;
  title: string;
}

function MobileAppView() {
  const [activeView, setActiveView] = useState<ActiveView | null>(null);
  const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(null);
  const drawer = useSwipeDrawer();

  // Auto-select first space if none selected
  const mikoto = useMikoto();
  useSnapshot(mikoto.spaces);
  useEffect(() => {
    if (selectedSpaceId) return;
    const spaces = Array.from(mikoto.spaces.cache.values()).filter(
      (s) => s.type === 'NONE',
    );
    if (spaces.length > 0) {
      setSelectedSpaceId(spaces[0].id);
    }
  }, [mikoto.spaces, selectedSpaceId]);

  function handleSelectChannel(tab: Tabable, title: string) {
    setActiveView({ tab, title });
    drawer.close();
  }

  function handleBack() {
    setActiveView(null);
  }

  return (
    <MobileContainer
      onTouchStart={drawer.onTouchStart}
      onTouchMove={drawer.onTouchMove}
      onTouchEnd={drawer.onTouchEnd}
    >
      {/* Main content area */}
      {activeView ? (
        <>
          <MobileHeader>
            <HeaderButton onClick={handleBack}>
              <FontAwesomeIcon icon={faArrowLeft} />
            </HeaderButton>
            <Heading fontSize="16px" fontWeight="600" flex="1" truncate>
              {activeView.title}
            </Heading>
          </MobileHeader>
          <SurfaceView tab={activeView.tab} />
        </>
      ) : (
        <WelcomeContent onOpenSidebar={drawer.open} />
      )}

      {/* Drawer overlay */}
      <DrawerOverlay
        visible={drawer.offset > -SIDEBAR_WIDTH}
        onClick={drawer.close}
        style={{
          opacity: Math.max(0, (drawer.offset + SIDEBAR_WIDTH) / SIDEBAR_WIDTH),
        }}
      />

      {/* Drawer */}
      <DrawerContainer translateX={drawer.offset} animate={drawer.animate}>
        <SidebarContent
          selectedSpaceId={selectedSpaceId}
          onSelectSpace={setSelectedSpaceId}
          onSelectChannel={handleSelectChannel}
        />
      </DrawerContainer>
    </MobileContainer>
  );
}

// --- Fallback ---

function MobileFallback() {
  return (
    <MobileContainer>
      <Flex
        w="100%"
        h="100%"
        align="center"
        justify="center"
        direction="column"
      >
        <FontAwesomeIcon icon={faMikoto} fontSize="60px" />
        <Box fontSize="18px" mt="10px">
          Loading...
        </Box>
      </Flex>
    </MobileContainer>
  );
}

export default function MobileMainView() {
  return (
    <MikotoClientProvider fallback={<MobileFallback />}>
      <MobileAppView />
      <CommandMenuKit />
      <ContextMenuKit />
      <ModalKit />
    </MikotoClientProvider>
  );
}
