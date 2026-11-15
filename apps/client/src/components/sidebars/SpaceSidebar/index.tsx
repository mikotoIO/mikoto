import { DragDropProvider } from '@dnd-kit/react';
import { isSortable, useSortable } from '@dnd-kit/react/sortable';
import { MikotoClient, MikotoSpace } from '@mikoto-io/mikoto.js';
import { useAtom, useSetAtom } from 'jotai';
import { Compass, PanelLeftOpen, Plus } from 'lucide-react';
import { useState } from 'react';
import { useSnapshot } from 'valtio/react';

import { modalState, useContextMenu } from '@/components/ContextMenu';
import { SpaceIcon } from '@/components/atoms/SpaceIcon';
import { MikotoLogo } from '@/components/icons';
import { SpaceJoinModal } from '@/components/modals/SpaceJoin';
import { cx, describeError, toast } from '@/design';
import { reorder } from '@/functions/reorder';
import { useMikoto } from '@/hooks';
import { treebarSpaceState, workspaceState } from '@/store';
import { useTabkit } from '@/store/surface';
import { ackStore, isSpaceUnread } from '@/store/unreads';

import { Pill } from './Pill';
import { SpaceBackContextMenu, SpaceContextMenu } from './SpaceContextMenu';
import styles from './SpaceSidebar.module.css';
import { SpaceIconTooltip } from './Tooltip';

function useSpaceUnreadState(mikoto: MikotoClient) {
  useSnapshot(ackStore);
  useSnapshot(mikoto.channels.cache);
  return {
    isUnread: (spaceId: string) => isSpaceUnread(mikoto, spaceId),
  };
}

interface SidebarSpaceIconProps {
  space: MikotoSpace;
  unread?: boolean;
}

function SortableSpaceIcon({
  space,
  index,
  unread,
}: SidebarSpaceIconProps & { index: number }) {
  const { ref, isDragging } = useSortable({
    id: space.id,
    index,
  });

  return (
    <div ref={ref} className={cx(styles.item, isDragging && styles.dragging)}>
      <SidebarSpaceIcon space={space} unread={unread} />
    </div>
  );
}

function SidebarSpaceIcon({ space, unread }: SidebarSpaceIconProps) {
  const [leftSidebar, setLeftSidebar] = useAtom(treebarSpaceState);
  const isActive =
    leftSidebar?.kind === 'explorer' && leftSidebar.spaceId === space.id;
  const setWorkspace = useSetAtom(workspaceState);

  const contextMenu = useContextMenu(() => <SpaceContextMenu space={space} />);

  return (
    <SpaceIconTooltip tooltip={space.name}>
      <button
        type="button"
        className={styles.spaceBtn}
        aria-label={unread ? `${space.name}, unread` : space.name}
        aria-current={isActive ? 'true' : undefined}
        onContextMenu={contextMenu}
        onDoubleClick={() => {
          setWorkspace((x) => ({ ...x, leftOpen: !x.leftOpen }));
        }}
        onClick={() => {
          setLeftSidebar({
            kind: 'explorer',
            key: `explorer/${space.id}`,
            spaceId: space.id,
          });
        }}
      >
        {unread && !isActive && <Pill h={8} />}
        <SpaceIcon space={space} active={isActive} />
      </button>
    </SpaceIconTooltip>
  );
}

// order spaces in the same order as the array of IDs
// if an ID is not in the array, it is pushed to the end
function orderSpaces(mikoto: MikotoClient, order: string[]) {
  const ordered: MikotoSpace[] = [];
  const unordered: MikotoSpace[] = [];
  const keys = new Set(mikoto.spaces.cache.keys());
  order.forEach((id) => {
    const space = mikoto.spaces._get(id);
    if (space && space.type === 'NONE') {
      ordered.push(space);
    }
    keys.delete(id);
  });

  keys.forEach((id) => {
    const space = mikoto.spaces._get(id);
    if (space && space.type === 'NONE') {
      unordered.push(space);
    }
  });
  const res = [...ordered, ...unordered];
  return [res, unordered.length === 0] as const;
}

function JoinSpaceButton() {
  const setModal = useSetAtom(modalState);

  return (
    <SpaceIconTooltip tooltip="Create or join a space">
      <button
        type="button"
        className={cx(styles.spaceBtn, styles.plain)}
        aria-label="Create or join a space"
        onClick={() => {
          setModal({ elem: <SpaceJoinModal /> });
        }}
      >
        <Plus size={18} aria-hidden />
      </button>
    </SpaceIconTooltip>
  );
}

function DiscoverButton() {
  const tabkit = useTabkit();
  return (
    <SpaceIconTooltip tooltip="Discover spaces">
      <button
        type="button"
        className={cx(styles.spaceBtn, styles.plain)}
        aria-label="Discover spaces"
        onClick={() => {
          tabkit.openTab({ kind: 'discovery', key: 'discovery' }, false);
        }}
      >
        <Compass size={18} aria-hidden />
      </button>
    </SpaceIconTooltip>
  );
}

function HomeButton() {
  const [spaceId, setSpaceId] = useAtom(treebarSpaceState);
  const isHome = spaceId === null;
  return (
    <SpaceIconTooltip tooltip="Home">
      <button
        type="button"
        className={cx(styles.spaceBtn, styles.home, isHome && styles.active)}
        aria-label="Home"
        aria-current={isHome ? 'true' : undefined}
        onClick={() => setSpaceId(null)}
      >
        <MikotoLogo size={20} />
      </button>
    </SpaceIconTooltip>
  );
}

function ShowSidebarButton() {
  const [workspace, setWorkspace] = useAtom(workspaceState);
  if (workspace.leftOpen) return null;
  return (
    <SpaceIconTooltip tooltip="Show sidebar">
      <button
        type="button"
        className={cx(styles.spaceBtn, styles.plain)}
        aria-label="Show sidebar"
        onClick={() => setWorkspace((ws) => ({ ...ws, leftOpen: true }))}
      >
        <PanelLeftOpen size={18} aria-hidden />
      </button>
    </SpaceIconTooltip>
  );
}

/** The slim space rail: Home, your spaces (drag to reorder), join, discover. */
export function SpaceSidebar() {
  const mikoto = useMikoto();
  const { isUnread } = useSpaceUnreadState(mikoto);

  useSnapshot(mikoto.spaces);
  const contextMenu = useContextMenu(() => <SpaceBackContextMenu />);

  const [order, setOrder] = useState<string[]>(
    () => mikoto.user.me?.spaceOrder ?? [],
  );
  const [spaceArray, isOrdered] = orderSpaces(mikoto, order);
  if (!isOrdered) {
    setOrder(spaceArray.map((x) => x.id));
  }

  return (
    <DragDropProvider
      onDragEnd={(event) => {
        if (event.canceled) return;
        const { source } = event.operation;
        if (!isSortable(source)) return;

        const fromIndex = source.sortable.initialIndex;
        const toIndex = source.sortable.index;
        if (fromIndex === toIndex) return;

        const previous = spaceArray.map((s) => s.id);
        const reordered = reorder(previous, fromIndex, toIndex);
        setOrder(reordered);
        if (mikoto.user.me) {
          mikoto.user.me.spaceOrder = reordered;
        }
        mikoto.rest['user.update']({ spaceOrder: reordered }, {}).catch(
          (err: unknown) => {
            toast({
              type: 'error',
              title: "Couldn't save your space order",
              description: describeError(err, { context: 'action' }).message,
            });
          },
        );
      }}
    >
      <nav
        className={styles.rail}
        aria-label="Spaces"
        onContextMenu={contextMenu}
      >
        <HomeButton />
        <hr className={styles.divider} />
        {spaceArray.map((space, index) => (
          <SortableSpaceIcon
            key={space.id}
            space={space}
            index={index}
            unread={isUnread(space.id)}
          />
        ))}
        <JoinSpaceButton />
        <DiscoverButton />
        <span className={styles.spacer} />
        <ShowSidebarButton />
      </nav>
    </DragDropProvider>
  );
}
