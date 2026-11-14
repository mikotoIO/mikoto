import { MikotoChannel, MikotoSpace } from '@mikoto-io/mikoto.js';
import { useAtom, useSetAtom } from 'jotai';
import { ChevronDown, Globe, Plus, UserPlus } from 'lucide-react';
import { NumberSize, Resizable } from 're-resizable';
import { Suspense } from 'react';
import { useSnapshot } from 'valtio/react';

import {
  ContextMenu,
  modalState,
  useContextMenuX,
} from '@/components/ContextMenu';
import { InviteModal } from '@/components/modals/Invite';
import {
  RESIZABLE_DISABLES,
  SidebarHeadActions,
  SidebarLabel,
  SidebarRowsSkeleton,
  sidebarStyles,
} from '@/components/sidebars/Base';
import { MemberListSidebar } from '@/components/sidebars/MemberListSidebar';
import { SpaceMenuItems } from '@/components/sidebars/SpaceSidebar/SpaceContextMenu';
import {
  Button,
  DelayedFallback,
  IconButton,
  Menu,
  MenuContent,
  MenuTrigger,
  RegionErrorBoundary,
  cx,
  spaceAccent,
  toast,
} from '@/design';
import { useFetchMember, useMikoto } from '@/hooks';
import { explorerPanelsState, treebarSpaceState } from '@/store';
import { useActiveTabId, useTabkit } from '@/store/surface';
import { ackChannel, ackStore, isChannelUnread } from '@/store/unreads';

import { ChannelContextMenu, CreateChannelModal } from './ChannelContextMenu';
import { ChannelTree } from './ChannelTree';
import styles from './Explorer.module.css';
import { getIconFromChannelType, tryChannelToTab } from './channelToTab';
import { channelToStructuredTree } from './explorerNode';

const ICON = 15;

export function TreebarContextMenu({ space }: { space: MikotoSpace }) {
  const setModal = useSetAtom(modalState);
  return (
    <ContextMenu>
      <ContextMenu.Item
        icon={<Plus size={ICON} />}
        onClick={() => {
          setModal({ elem: <CreateChannelModal space={space} /> });
        }}
      >
        Create channel
      </ContextMenu.Item>
      <ContextMenu.Item
        icon={<UserPlus size={ICON} />}
        onClick={() => {
          setModal({ elem: <InviteModal space={space} /> });
        }}
      >
        Invite people
      </ContextMenu.Item>
    </ContextMenu>
  );
}

/* ---------------------------------------------------------------- banner */

// Contour lines for the banner, computed once. Concentric wobbly rings
// centred off the top-right corner, like a topographic map.
const TOPO_PATHS = Array.from({ length: 8 }, (_, i) => {
  const k = i + 1;
  const r = k * 10;
  let d = '';
  for (let a = 0; a <= 72; a++) {
    const t = (a / 72) * Math.PI * 2;
    const rr =
      r * (1 + 0.16 * Math.sin(3 * t + k * 0.7) + 0.07 * Math.sin(5 * t - k));
    d += `${a ? 'L' : 'M'}${(196 + Math.cos(t) * rr * 1.5).toFixed(1)} ${(
      18 +
      Math.sin(t) * rr
    ).toFixed(1)}`;
  }
  return `${d}Z`;
});

function Topo() {
  return (
    <svg
      className={styles.topo}
      viewBox="0 0 240 96"
      preserveAspectRatio="xMaxYMin slice"
      fill="none"
      stroke="currentColor"
      strokeWidth={1}
      aria-hidden
    >
      {TOPO_PATHS.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}

function SpaceBanner({ space }: { space: MikotoSpace }) {
  const accent = spaceAccent(space);
  const isPublic = space.visibility === 'PUBLIC';
  const memberCount =
    typeof space.memberCount === 'number' ? space.memberCount : null;

  return (
    <header
      className={cx(styles.banner, accent && styles.accented)}
      style={accent ? { '--space': accent } : undefined}
    >
      <Topo />
      <SidebarHeadActions
        className={styles.bannerActions}
        searchLabel={`Search ${space.name}`}
      />
      <Menu>
        <MenuTrigger
          render={
            <button type="button" className={styles.spaceName}>
              <span className={styles.spaceNameText}>{space.name}</span>
              <ChevronDown size={14} aria-hidden />
            </button>
          }
          aria-label={`${space.name} options`}
        />
        <MenuContent align="start">
          <SpaceMenuItems space={space} />
        </MenuContent>
      </Menu>
      {isPublic && (
        <div className={styles.bannerMeta}>
          <Globe size={12} aria-hidden />
          {memberCount === null
            ? 'Public space'
            : `Public · ${memberCount} ${memberCount === 1 ? 'member' : 'members'}`}
        </div>
      )}
    </header>
  );
}

/* --------------------------------------------------------------- channels */

function useAcks() {
  useSnapshot(ackStore);

  return {
    isChannelUnread(channel: MikotoChannel) {
      return isChannelUnread(channel.lastUpdated, channel.id);
    },
    ackChannel(channel: MikotoChannel) {
      const now = new Date().toISOString();
      channel
        .ack()
        .then(() => {
          ackChannel(channel.id, now);
        })
        .catch(() => {
          // Unread state is cosmetic; the next ack will catch up.
        });
    },
  };
}

function ExplorerInner({ space }: { space: MikotoSpace }) {
  useFetchMember(space);
  const tabkit = useTabkit();
  const activeTabId = useActiveTabId();
  const { isChannelUnread: isUnread, ackChannel } = useAcks();
  const nodeContextMenu = useContextMenuX();

  useSnapshot(space);
  useSnapshot(space.channels); // TODO: fine-grained subscription

  const channelTree = channelToStructuredTree(space.channels, (channel) => {
    const tab = tryChannelToTab(channel);
    return {
      icon: getIconFromChannelType(channel.type),
      id: channel.id,
      text: channel.name,
      unread: isUnread(channel),
      active: tab !== null && activeTabId === `${tab.kind}/${tab.key}`,
      onClick(ev) {
        if (!tab) {
          toast({
            type: 'error',
            title: `Couldn't open #${channel.name}`,
            description:
              "This channel type isn't supported by this version of Mikoto. Reload to update.",
          });
          return;
        }
        // Always open in a new tab if Ctrl is pressed or if there are already tabs
        const forceNewTab = ev.ctrlKey || tabkit.getTabs().length > 0;
        tabkit.openTab(tab, forceNewTab);
        ackChannel(channel);
      },
      onContextMenu: nodeContextMenu(() => (
        <ChannelContextMenu channel={channel} />
      )),
      onDragStart(ev) {
        if (!tab) return;
        ev.dataTransfer.effectAllowed = 'move';
        ev.dataTransfer.setData('application/mikoto-tab', JSON.stringify(tab));
        ev.dataTransfer.setData('text/plain', channel.name);
      },
    };
  });

  const nodes = channelTree.descendant ?? [];
  if (nodes.length === 0) {
    return (
      <p className={sidebarStyles.empty}>
        No channels yet. Create one to get the conversation going.
      </p>
    );
  }
  return <ChannelTree nodes={nodes} />;
}

export function Explorer({ space }: { space: MikotoSpace }) {
  const nodeContextMenu = useContextMenuX();
  const setModal = useSetAtom(modalState);
  const [panels, setPanels] = useAtom(explorerPanelsState);

  const channelsLabel = (
    <SidebarLabel
      collapsed={panels.channelsCollapsed}
      onToggle={() =>
        setPanels((p) => ({ ...p, channelsCollapsed: !p.channelsCollapsed }))
      }
      onContextMenu={nodeContextMenu(<TreebarContextMenu space={space} />)}
      action={
        <IconButton
          aria-label="Create channel"
          onClick={() => {
            setModal({ elem: <CreateChannelModal space={space} /> });
          }}
        >
          <Plus size={14} aria-hidden />
        </IconButton>
      }
    >
      Channels
    </SidebarLabel>
  );

  const channels = (
    <div
      className={styles.channels}
      onContextMenu={nodeContextMenu(<TreebarContextMenu space={space} />)}
    >
      {channelsLabel}
      <RegionErrorBoundary what="Channels" resetKeys={[space.id]}>
        <ExplorerInner space={space} />
      </RegionErrorBoundary>
    </div>
  );

  let channelSection;
  if (panels.channelsCollapsed) {
    channelSection = <div className={styles.channels}>{channelsLabel}</div>;
  } else if (panels.membersCollapsed) {
    channelSection = channels;
  } else {
    channelSection = (
      <Resizable
        className={styles.resizable}
        enable={{ ...RESIZABLE_DISABLES, bottom: true }}
        size={{ width: '100%', height: panels.channelsHeight }}
        minHeight={60}
        maxHeight="80%"
        onResizeStop={(
          _e: unknown,
          _dir: unknown,
          _ref: unknown,
          d: NumberSize,
        ) => {
          setPanels((p) => ({
            ...p,
            channelsHeight: p.channelsHeight + d.height,
          }));
        }}
        handleClasses={{ bottom: styles.resizeHandle }}
        handleStyles={{
          bottom: { height: 4, bottom: 0, cursor: 'row-resize' },
        }}
      >
        {channels}
      </Resizable>
    );
  }

  return (
    <div className={styles.explorer}>
      <SpaceBanner space={space} />
      {channelSection}
      <SidebarLabel
        className={styles.membersLabel}
        collapsed={panels.membersCollapsed}
        onToggle={() =>
          setPanels((p) => ({ ...p, membersCollapsed: !p.membersCollapsed }))
        }
      >
        Members
      </SidebarLabel>
      {!panels.membersCollapsed && (
        <div className={styles.members}>
          <RegionErrorBoundary what="Members" resetKeys={[space.id]}>
            <Suspense
              fallback={
                <DelayedFallback>
                  <SidebarRowsSkeleton rows={5} label="members" />
                </DelayedFallback>
              }
            >
              <MemberListSidebar space={space} />
            </Suspense>
          </RegionErrorBoundary>
        </div>
      )}
    </div>
  );
}

function MissingSpace() {
  const setLeftSidebar = useSetAtom(treebarSpaceState);
  return (
    <div className={sidebarStyles.empty} role="status">
      <p>
        This space isn't available. You may have left it, or it was deleted.
      </p>
      <Button
        size="sm"
        className={styles.missingAction}
        onClick={() => setLeftSidebar(null)}
      >
        Go to Home
      </Button>
    </div>
  );
}

export function ExplorerSurface({ spaceId }: { spaceId: string }) {
  const mikoto = useMikoto();
  useSnapshot(mikoto.spaces);
  const space = mikoto.spaces._get(spaceId);
  if (space === undefined) return <MissingSpace />;
  return <Explorer space={space} />;
}
